import { notFound } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { deliveries, orderItems, orderStatusHistory, orders, payments } from "@/db/schema";
import { OrderStatusForm, PaymentForm } from "@/components/admin-forms";
import { formatDateTime, formatMnt } from "@/lib/format";
import { CONTACT_PREFERENCE_LABELS, ORDER_STATUS_LABELS, PAYMENT_METHOD_LABELS } from "@/lib/labels";
import { ALLOWED_TRANSITIONS } from "@/lib/orders";

export const metadata = { title: "Админ: захиалгын дэлгэрэнгүй" };

export default async function AdminOrder({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) notFound();
  const o = (await db.select().from(orders).where(eq(orders.id, id)).limit(1))[0];
  if (!o) notFound();
  const [items, history, pay, del] = await Promise.all([
    db.select().from(orderItems).where(eq(orderItems.orderId, id)),
    db.select().from(orderStatusHistory).where(eq(orderStatusHistory.orderId, id)).orderBy(asc(orderStatusHistory.createdAt)),
    db.select().from(payments).where(eq(payments.orderId, id)).limit(1).then((r) => r[0]),
    db.select().from(deliveries).where(eq(deliveries.orderId, id)).limit(1).then((r) => r[0]),
  ]);
  const allowed = ALLOWED_TRANSITIONS[o.status] as (keyof typeof ORDER_STATUS_LABELS)[];
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-3xl font-bold">Захиалга {o.orderNumber}</h1>
      <p className="mt-2 text-lg">Төлөв: <strong>{ORDER_STATUS_LABELS[o.status]}</strong> · Нийт: {formatMnt(o.totalMnt)}</p>
      <section className="card mt-4 p-5" aria-labelledby="cust"><h2 id="cust" className="text-xl font-bold">Худалдан авагч</h2>
        <p>{o.contactName} · {o.contactPhone} {o.contactEmail && `· ${o.contactEmail}`}</p>
        <p>Холбогдох хэлбэр: <strong>{CONTACT_PREFERENCE_LABELS[o.contactPreference]}</strong></p>
        {o.addressLine && <p>Хаяг: {[o.city, o.district, o.khoroo && `${o.khoroo}-р хороо`, o.addressLine].filter(Boolean).join(", ")}{o.addressNote && ` (${o.addressNote})`}</p>}
        {o.customerNote && <p>Тэмдэглэл: {o.customerNote}</p>}
        <p>Хүргэлт: {o.deliveryMethodName} ({formatMnt(o.deliveryFeeMnt)}) {del?.trackingInfo && `· ${del.trackingInfo}`}</p>
      </section>
      <section className="card mt-4 p-5" aria-labelledby="items"><h2 id="items" className="text-xl font-bold">Бараа</h2>
        <ul className="mt-2" role="list">{items.map((i) => <li key={i.id}>{i.productName} × {i.quantity} — {formatMnt(i.unitPriceMnt * i.quantity)}</li>)}</ul></section>
      <section className="card mt-4 p-5" aria-labelledby="pay"><h2 id="pay" className="text-xl font-bold">Төлбөр</h2>
        <p>Хэлбэр: {PAYMENT_METHOD_LABELS[o.paymentMethod]}</p>
        {pay && <PaymentForm orderId={id} current={pay.status === "cancelled" ? "pending" : pay.status} />}</section>
      <section className="card mt-4 p-5" aria-labelledby="st"><h2 id="st" className="mb-3 text-xl font-bold">Төлөв өөрчлөх</h2><OrderStatusForm orderId={id} allowed={allowed.filter((s) => s !== "created")} /></section>
      <section className="card mt-4 p-5" aria-labelledby="hist"><h2 id="hist" className="text-xl font-bold">Түүх</h2>
        <ul className="mt-2" role="list">{history.map((h) => <li key={h.id}>{formatDateTime(h.createdAt)} — {ORDER_STATUS_LABELS[h.status]}{h.note && `. ${h.note}`}</li>)}</ul></section>
    </div>
  );
}
