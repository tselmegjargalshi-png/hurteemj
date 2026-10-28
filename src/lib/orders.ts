import "server-only";
import { randomInt } from "node:crypto";
import { and, eq, gte, inArray, sql } from "drizzle-orm";
import { db, type Tx } from "@/db";
import {
  cartItems,
  deliveries,
  deliveryMethods,
  inventoryMovements,
  orderItems,
  orderStatusHistory,
  orders,
  payments,
  products,
} from "@/db/schema";
import { audit } from "./audit";
import { notify } from "./notify";

export type CheckoutInput = {
  userId: string;
  cartId: string;
  contactName: string;
  contactPhone: string;
  contactEmail?: string;
  contactPreference: (typeof orders.$inferInsert)["contactPreference"];
  deliveryMethodId: number;
  city?: string;
  district?: string;
  khoroo?: string;
  addressLine?: string;
  addressNote?: string;
  paymentMethod: (typeof orders.$inferInsert)["paymentMethod"];
  customerNote?: string;
};

export class CheckoutError extends Error {}

function orderNumber() {
  const d = new Date();
  const ymd = `${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, "0")}${String(d.getUTCDate()).padStart(2, "0")}`;
  return `ZH-${ymd}-${randomInt(100000, 999999)}`;
}

/**
 * Захиалга үүсгэх. Нэг transaction дотор:
 *  - үнэ, нөөцийг DB-с дахин уншина (клиентээс итгэхгүй)
 *  - нөөцийг атомаар хасна (хангалтгүй бол алдаа — давхар зарагдахаас сэргийлнэ)
 *  - төлбөрийг ҮРГЭЛЖ "pending" төлөвтэй үүсгэнэ. Бодит төлбөр хүлээн аваагүй тул "paid" болгохгүй.
 */
export async function createOrder(input: CheckoutInput) {
  return db.transaction(async (tx) => {
    const lines = await tx
      .select({ productId: cartItems.productId, quantity: cartItems.quantity })
      .from(cartItems)
      .where(eq(cartItems.cartId, input.cartId));
    if (!lines.length) throw new CheckoutError("Сагс хоосон байна.");

    const method = (await tx.select().from(deliveryMethods).where(and(eq(deliveryMethods.id, input.deliveryMethodId), eq(deliveryMethods.isActive, true))).limit(1))[0];
    if (!method) throw new CheckoutError("Хүргэлтийн төрөл олдсонгүй. Дахин сонгоно уу.");
    if (method.requiresAddress && !input.addressLine) throw new CheckoutError("Хаяг оруулна уу.");

    const prods = await tx.select().from(products).where(inArray(products.id, lines.map((l) => l.productId)));
    let subtotal = 0;
    const snapshot: { productId: string; name: string; price: number; qty: number }[] = [];
    for (const l of lines) {
      const p = prods.find((x) => x.id === l.productId);
      if (!p || p.status !== "published") throw new CheckoutError("Сагсан дахь нэг бараа худалдаанаас хасагдсан байна. Сагсаа шалгана уу.");
      // Нөөцийг атомаар хасна.
      const updated = await tx
        .update(products)
        .set({ stock: sql`${products.stock} - ${l.quantity}`, updatedAt: new Date() })
        .where(and(eq(products.id, p.id), gte(products.stock, l.quantity)))
        .returning({ id: products.id });
      if (!updated.length) throw new CheckoutError(`«${p.name}» хангалттай нөөцгүй байна (үлдэгдэл: ${p.stock}). Сагсан дахь тоо ширхэгээ багасгана уу.`);
      subtotal += p.priceMnt * l.quantity;
      snapshot.push({ productId: p.id, name: p.name, price: p.priceMnt, qty: l.quantity });
    }

    const total = subtotal + method.feeMnt;
    let order: typeof orders.$inferSelect | undefined;
    for (let attempt = 0; attempt < 5 && !order; attempt++) {
      const [o] = await tx
        .insert(orders)
        .values({
          orderNumber: orderNumber(),
          userId: input.userId,
          contactName: input.contactName,
          contactPhone: input.contactPhone,
          contactEmail: input.contactEmail ?? null,
          contactPreference: input.contactPreference,
          city: input.city ?? null,
          district: input.district ?? null,
          khoroo: input.khoroo ?? null,
          addressLine: input.addressLine ?? null,
          addressNote: input.addressNote ?? null,
          deliveryMethodId: method.id,
          deliveryMethodName: method.name,
          deliveryFeeMnt: method.feeMnt,
          subtotalMnt: subtotal,
          totalMnt: total,
          paymentMethod: input.paymentMethod,
          customerNote: input.customerNote ?? null,
        })
        .onConflictDoNothing({ target: orders.orderNumber })
        .returning();
      order = o;
    }
    if (!order) throw new CheckoutError("Захиалгын дугаар үүсгэж чадсангүй. Дахин оролдоно уу.");

    await tx.insert(orderItems).values(snapshot.map((s) => ({ orderId: order.id, productId: s.productId, productName: s.name, unitPriceMnt: s.price, quantity: s.qty })));
    await tx.insert(inventoryMovements).values(snapshot.map((s) => ({ productId: s.productId, delta: -s.qty, reason: "order" as const, orderId: order.id, actorId: input.userId })));
    await tx.insert(payments).values({ orderId: order.id, method: input.paymentMethod, status: "pending", amountMnt: total });
    await tx.insert(deliveries).values({ orderId: order.id });
    await tx.insert(orderStatusHistory).values({ orderId: order.id, status: "created", note: "Захиалга үүслээ", actorId: input.userId });
    await tx.delete(cartItems).where(eq(cartItems.cartId, input.cartId));
    await notify(
      input.userId,
      `Захиалга ${order.orderNumber} хүлээн авлаа`,
      "Таны захиалга бүртгэгдлээ. Манай ажилтан бичгээр баталгаажуулна. Төлбөр одоогоор төлөгдөөгүй төлөвтэй байна.",
      `/orders/${order.id}`,
      tx,
    );
    await audit({ actorId: input.userId, action: "order.create", entityType: "order", entityId: order.id, details: { total } }, tx);
    return order;
  });
}

export const ALLOWED_TRANSITIONS: Record<(typeof orders.$inferSelect)["status"], (typeof orders.$inferSelect)["status"][]> = {
  created: ["confirmed", "cancelled"],
  confirmed: ["processing", "cancelled"],
  processing: ["shipped", "cancelled"],
  shipped: ["delivered"],
  delivered: [],
  cancelled: [],
};

/** Төлөв өөрчлөх. Цуцлахад нөөцийг буцаана. Хүргэгдсэн болоход (бэлнээр төлөх) төлбөрийг админ тусад нь баталгаажуулна. */
export async function changeOrderStatus(orderId: string, to: (typeof orders.$inferSelect)["status"], actorId: string, note?: string, tx0?: Tx) {
  const run = async (tx: Tx) => {
    const order = (await tx.select().from(orders).where(eq(orders.id, orderId)).for("update").limit(1))[0];
    if (!order) throw new CheckoutError("Захиалга олдсонгүй.");
    if (!ALLOWED_TRANSITIONS[order.status].includes(to)) throw new CheckoutError("Энэ төлөв рүү шилжүүлэх боломжгүй.");
    await tx.update(orders).set({ status: to, updatedAt: new Date() }).where(eq(orders.id, orderId));
    await tx.insert(orderStatusHistory).values({ orderId, status: to, note: note ?? null, actorId });
    if (to === "cancelled") {
      const items = await tx.select().from(orderItems).where(eq(orderItems.orderId, orderId));
      for (const it of items) {
        if (!it.productId) continue;
        await tx.update(products).set({ stock: sql`${products.stock} + ${it.quantity}` }).where(eq(products.id, it.productId));
        await tx.insert(inventoryMovements).values({ productId: it.productId, delta: it.quantity, reason: "order_cancelled", orderId, actorId });
      }
      await tx.update(payments).set({ status: "cancelled", updatedAt: new Date() }).where(and(eq(payments.orderId, orderId), eq(payments.status, "pending")));
    }
    if (to === "shipped") await tx.update(deliveries).set({ status: "out_for_delivery", updatedAt: new Date() }).where(eq(deliveries.orderId, orderId));
    if (to === "delivered") await tx.update(deliveries).set({ status: "delivered", updatedAt: new Date() }).where(eq(deliveries.orderId, orderId));
    const label = { created: "Үүссэн", confirmed: "Баталгаажсан", processing: "Боловсруулагдаж байгаа", shipped: "Хүргэлтэд гарсан", delivered: "Хүргэгдсэн", cancelled: "Цуцлагдсан" }[to];
    await notify(order.userId, `Захиалга ${order.orderNumber}: ${label}`, note ? `${label}. ${note}` : `Захиалгын төлөв «${label}» боллоо.`, `/orders/${orderId}`, tx);
    await audit({ actorId, action: "order.status", entityType: "order", entityId: orderId, details: { from: order.status, to } }, tx);
  };
  if (tx0) await run(tx0);
  else await db.transaction(run);
}
