"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/db";
import { categories, deliveries, deliveryMethods, inventoryMovements, orders, payments, productImages, products, supportMessages, supportRequests, users } from "@/db/schema";
import { audit } from "@/lib/audit";
import { requireAdmin } from "@/lib/auth";
import { errorState, successState, zodErrorState, type ActionState } from "@/lib/forms";
import { formatMnt, slugify } from "@/lib/format";
import { notify } from "@/lib/notify";
import { CheckoutError, changeOrderStatus } from "@/lib/orders";
import { setSetting } from "@/lib/settings";
import { checkbox, httpsUrl, intMnt, opt, req } from "@/lib/validation";

// ── Бүтээгдэхүүн ────────────────────────────────────────────────

const productSchema = z.object({
  id: z.string().uuid().optional().or(z.literal("").transform(() => undefined)),
  name: req("Нэр", 200),
  categoryId: z.coerce.number({ invalid_type_error: "Ангилал сонгоно уу." }).int().min(1, "Ангилал сонгоно уу."),
  summary: opt(500),
  description: opt(8000),
  usage: opt(4000),
  specifications: opt(4000),
  suitableFor: opt(2000),
  cautions: opt(2000),
  priceMnt: intMnt("Үнэ"),
  priceVerified: checkbox,
  stock: intMnt("Нөөц"),
  deliveryInfo: opt(2000),
  warrantyInfo: opt(2000),
  returnPolicy: opt(2000),
  supplierName: opt(200),
  sourceNote: opt(1000),
  condition: z.enum(["new", "used_inspected"]),
  status: z.enum(["draft", "published", "archived"]),
  isFeatured: checkbox,
  imageUrl: z.union([z.literal(""), httpsUrl]).transform((v) => v || undefined),
  imageAlt: opt(300),
  imageCredit: opt(300),
  imageAi: checkbox,
});

/** Үзүүлэлтийг "Нэр: утга" мөр бүрээр задлана. */
function parseSpecs(text?: string) {
  return (text ?? "")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => {
      const i = l.indexOf(":");
      return i > 0 ? { label: l.slice(0, i).trim(), value: l.slice(i + 1).trim() } : { label: "Тайлбар", value: l };
    });
}

export async function saveProduct(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  const parsed = productSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return zodErrorState(parsed.error, fd);
  const d = parsed.data;
  if (d.imageUrl && !d.imageAlt) return zodErrorState(new z.ZodError([{ code: "custom", path: ["imageAlt"], message: "Зургийн тайлбар (alt) заавал оруулна. Дэлгэц уншигчид зориулагдсан." }]), fd);
  if (d.status === "published" && !d.imageUrl && !d.id) {
    // Нийтлэхэд зураг заавал биш, гэхдээ анхааруулга. (Админ зургийг дараа нэмж болно.)
  }
  const values = {
    name: d.name,
    categoryId: d.categoryId,
    summary: d.summary ?? "",
    description: d.description ?? "",
    usage: d.usage ?? "",
    specifications: parseSpecs(d.specifications),
    suitableFor: d.suitableFor ?? "",
    cautions: d.cautions ?? "",
    priceMnt: d.priceMnt,
    priceVerified: d.priceVerified,
    stock: d.stock,
    deliveryInfo: d.deliveryInfo ?? "",
    warrantyInfo: d.warrantyInfo ?? "",
    returnPolicy: d.returnPolicy ?? "",
    supplierName: d.supplierName ?? "",
    sourceNote: d.sourceNote ?? "",
    condition: d.condition,
    status: d.status,
    isFeatured: d.isFeatured,
    updatedAt: new Date(),
  };
  let id = d.id;
  try {
    await db.transaction(async (tx) => {
      if (id) {
        const before = (await tx.select({ stock: products.stock }).from(products).where(eq(products.id, id)).for("update"))[0];
        if (!before) throw new CheckoutError("Бүтээгдэхүүн олдсонгүй.");
        await tx.update(products).set(values).where(eq(products.id, id));
        if (before.stock !== d.stock) await tx.insert(inventoryMovements).values({ productId: id, delta: d.stock - before.stock, reason: "admin_adjust", actorId: admin.id });
      } else {
        const base = slugify(d.name) || "product";
        const slug = `${base}-${Math.random().toString(36).slice(2, 6)}`;
        const [p] = await tx.insert(products).values({ ...values, slug }).returning({ id: products.id });
        id = p.id;
      }
      if (d.imageUrl) {
        await tx.insert(productImages).values({ productId: id!, url: d.imageUrl, alt: d.imageAlt!, credit: d.imageCredit ?? "", isAiGenerated: d.imageAi, sortOrder: 99 });
      }
      await audit({ actorId: admin.id, action: d.id ? "product.update" : "product.create", entityType: "product", entityId: id, details: { name: d.name, price: d.priceMnt, stock: d.stock, status: d.status } }, tx);
    });
  } catch (e) {
    if (e instanceof CheckoutError) return errorState(e.message, fd);
    throw e;
  }
  revalidatePath("/", "layout");
  if (!d.id) redirect(`/admin/products/${id}?saved=1`);
  return successState("Бүтээгдэхүүн хадгалагдлаа.");
}

export async function deleteProductImage(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  const imgId = z.coerce.number().int().safeParse(fd.get("imageId"));
  if (!imgId.success) return errorState("Зураг олдсонгүй.");
  await db.delete(productImages).where(eq(productImages.id, imgId.data));
  await audit({ actorId: admin.id, action: "product.image.delete", entityType: "product_image", entityId: String(imgId.data) });
  revalidatePath("/", "layout");
  return successState("Зураг устгагдлаа.");
}

// ── Ангилал ────────────────────────────────────────────────────

export async function saveCategory(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  const parsed = z.object({ id: z.coerce.number().int().optional().or(z.literal("").transform(() => undefined)), name: req("Нэр", 150), description: opt(500), sortOrder: z.coerce.number().int().min(0).max(1000).default(0) }).safeParse(Object.fromEntries(fd));
  if (!parsed.success) return zodErrorState(parsed.error, fd);
  const d = parsed.data;
  if (d.id) await db.update(categories).set({ name: d.name, description: d.description ?? "", sortOrder: d.sortOrder }).where(eq(categories.id, d.id));
  else await db.insert(categories).values({ name: d.name, description: d.description ?? "", sortOrder: d.sortOrder, slug: `${slugify(d.name) || "category"}-${Math.random().toString(36).slice(2, 5)}` });
  await audit({ actorId: admin.id, action: "category.save", entityType: "category", entityId: String(d.id ?? "new"), details: { name: d.name } });
  revalidatePath("/", "layout");
  return successState("Ангилал хадгалагдлаа.");
}

// ── Захиалга ───────────────────────────────────────────────────

export async function adminChangeOrderStatus(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  const p = z.object({ orderId: z.string().uuid(), status: z.enum(["confirmed", "processing", "shipped", "delivered", "cancelled"]), note: opt(500), trackingInfo: opt(500) }).safeParse(Object.fromEntries(fd));
  if (!p.success) return errorState("Төлөв сонгоно уу.");
  try {
    await db.transaction(async (tx) => {
      await changeOrderStatus(p.data.orderId, p.data.status, admin.id, p.data.note, tx);
      if (p.data.trackingInfo) await tx.update(deliveries).set({ trackingInfo: p.data.trackingInfo, updatedAt: new Date() }).where(eq(deliveries.orderId, p.data.orderId));
    });
  } catch (e) {
    if (e instanceof CheckoutError) return errorState(e.message);
    throw e;
  }
  revalidatePath(`/admin/orders/${p.data.orderId}`);
  return successState("Захиалгын төлөв шинэчлэгдлээ. Хэрэглэгчид бичгээр мэдэгдэл илгээгдсэн.");
}

/** Төлбөрийг ЗӨВХӨН админ гараар (дансны шилжүүлэг шалгасны дараа) баталгаажуулна. Автоматаар "paid" болохгүй. */
export async function adminSetPayment(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  const p = z.object({ orderId: z.string().uuid(), status: z.enum(["paid", "pending", "failed", "refunded"]) }).safeParse(Object.fromEntries(fd));
  if (!p.success) return errorState("Төлбөрийн төлөв буруу байна.");
  const order = (await db.select().from(orders).where(eq(orders.id, p.data.orderId)).limit(1))[0];
  if (!order) return errorState("Захиалга олдсонгүй.");
  if (order.status === "cancelled" && p.data.status === "paid") return errorState("Цуцлагдсан захиалгыг «төлөгдсөн» болгох боломжгүй.");
  await db.update(payments).set({ status: p.data.status, verifiedBy: admin.id, verifiedAt: new Date(), updatedAt: new Date() }).where(eq(payments.orderId, order.id));
  await audit({ actorId: admin.id, action: "payment.set", entityType: "order", entityId: order.id, details: { status: p.data.status } });
  if (p.data.status === "paid") await notify(order.userId, `Захиалга ${order.orderNumber}: төлбөр баталгаажлаа`, `${formatMnt(order.totalMnt)} төлбөр хүлээн авсныг баталгаажууллаа.`, `/orders/${order.id}`);
  revalidatePath(`/admin/orders/${order.id}`);
  return successState("Төлбөрийн төлөв шинэчлэгдлээ.");
}

// ── Тусламжийн хүсэлт ──────────────────────────────────────────

export async function adminReplySupport(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  const p = z.object({ requestId: z.string().uuid(), body: z.string().trim().max(4000).optional(), status: z.enum(["new", "in_progress", "waiting_customer", "resolved", "closed"]) }).safeParse(Object.fromEntries(fd));
  if (!p.success) return errorState("Мэдээлэл буруу байна.");
  const r = (await db.select().from(supportRequests).where(eq(supportRequests.id, p.data.requestId)).limit(1))[0];
  if (!r) return errorState("Хүсэлт олдсонгүй.");
  await db.transaction(async (tx) => {
    if (p.data.body) {
      await tx.insert(supportMessages).values({ requestId: r.id, authorId: admin.id, isStaff: true, body: p.data.body });
      if (r.userId) await notify(r.userId, `Тусламжийн хүсэлт ${r.referenceNumber}: хариу ирлээ`, p.data.body.slice(0, 200), `/help/${r.id}`, tx);
    }
    await tx.update(supportRequests).set({ status: p.data.status, updatedAt: new Date() }).where(eq(supportRequests.id, r.id));
    await audit({ actorId: admin.id, action: "support.update", entityType: "support_request", entityId: r.id, details: { status: p.data.status } }, tx);
  });
  revalidatePath(`/admin/support/${r.id}`);
  return successState("Хадгалагдлаа.");
}

// ── Хүргэлтийн төрөл ───────────────────────────────────────────

export async function saveDeliveryMethod(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  const p = z.object({ id: z.coerce.number().int().optional().or(z.literal("").transform(() => undefined)), name: req("Нэр", 100), description: opt(500), feeMnt: intMnt("Хүргэлтийн төлбөр"), estimatedTime: opt(100), requiresAddress: checkbox, isActive: checkbox }).safeParse(Object.fromEntries(fd));
  if (!p.success) return zodErrorState(p.error, fd);
  const v = { name: p.data.name, description: p.data.description ?? "", feeMnt: p.data.feeMnt, estimatedTime: p.data.estimatedTime ?? "", requiresAddress: p.data.requiresAddress, isActive: p.data.isActive };
  if (p.data.id) await db.update(deliveryMethods).set(v).where(eq(deliveryMethods.id, p.data.id));
  else await db.insert(deliveryMethods).values(v);
  await audit({ actorId: admin.id, action: "delivery.save", entityType: "delivery_method", entityId: String(p.data.id ?? "new") });
  revalidatePath("/", "layout");
  return successState("Хүргэлтийн төрөл хадгалагдлаа.");
}

// ── Тохиргоо ───────────────────────────────────────────────────

export async function saveSiteSettings(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  const p = z.object({ bankName: opt(100), accountName: opt(100), accountNumber: opt(50), bankNote: opt(500), announcement: opt(300) }).safeParse(Object.fromEntries(fd));
  if (!p.success) return zodErrorState(p.error, fd);
  await setSetting("bank_transfer_info", { bankName: p.data.bankName ?? "", accountName: p.data.accountName ?? "", accountNumber: p.data.accountNumber ?? "", note: p.data.bankNote ?? "" });
  await setSetting("home_announcement", { text: p.data.announcement ?? "" });
  await audit({ actorId: admin.id, action: "settings.save", entityType: "settings" });
  revalidatePath("/", "layout");
  return successState("Тохиргоо хадгалагдлаа.");
}

// ── Хэрэглэгч ──────────────────────────────────────────────────

export async function adminUpdateUser(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  const p = z.object({ userId: z.string().uuid(), role: z.enum(["customer", "service_provider", "supplier", "caregiver", "employer", "admin"]), status: z.enum(["active", "blocked"]) }).safeParse(Object.fromEntries(fd));
  if (!p.success) return errorState("Мэдээлэл буруу байна.");
  if (p.data.userId === admin.id && (p.data.role !== "admin" || p.data.status !== "active")) return errorState("Өөрийн админ эрх, төлөвийг өөрчлөх боломжгүй.");
  await db.update(users).set({ role: p.data.role, status: p.data.status, updatedAt: new Date() }).where(eq(users.id, p.data.userId));
  await audit({ actorId: admin.id, action: "user.update", entityType: "user", entityId: p.data.userId, details: { role: p.data.role, status: p.data.status } });
  revalidatePath("/admin/users");
  return successState("Хэрэглэгч шинэчлэгдлээ.");
}

