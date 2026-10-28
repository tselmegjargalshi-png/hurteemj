import Link from "next/link";
import { notFound } from "next/navigation";
import { and, asc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { deliveries, orderItems, orderStatusHistory, orders, payments } from "@/db/schema";
import { CancelOrderForm } from "@/components/cancel-order";
import { requireUser } from "@/lib/auth";
import { formatDateTime, formatMnt } from "@/lib/format";
import { CONTACT_PREFERENCE_LABELS, DELIVERY_STATUS_LABELS, ORDER_STATUS_FLOW, ORDER_STATUS_LABELS, PAYMENT_METHOD_LABELS, PAYMENT_STATUS_LABELS } from "@/lib/labels";

export const metadata = { title: "Захиалгын дэлгэрэнгүй" };

export default async function OrderPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ placed?: string }> }) {
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) notFound();
  const user = await requireUser(`/orders/${id}`);
  // Зөвхөн өөрийн захиалгыг харна (IDOR-оос хамгаална).
  const order = (await db.select().from(orders).where(and(eq(orders.id, id), eq(orders.userId, user.id))).limit(1))[0];
  if (!order) notFound();
  const [items, history, payment, delivery] = await Promise.all([
    db.select().from(orderItems).where(eq(orderItems.orderId, id)),
    db.select().from(orderStatusHistory).where(eq(orderStatusHistory.orderId, id)).orderBy(asc(orderStatusHistory.createdAt), asc(orderStatusHistory.id)),
    db.select().from(payments).where(eq(payments.orderId, id)).limit(1).then((r) => r[0]),
    db.select().from(deliveries).where(eq(deliveries.orderId, id)).limit(1).then((r) => r[0]),
  ]);
  const placed = (await searchParams).placed === "1";
  const stepIndex = ORDER_STATUS_FLOW.indexOf(order.status as (typeof ORDER_STATUS_FLOW)[number]);

  return (
    <div className="mx-auto max-w-3xl">
      {placed && (
        <div role="status" className="notice notice-success mb-6">
          <h2 className="text-xl font-bold">Захиалга амжилттай бүртгэгдлээ</h2>
          <p className="mt-1">Захиалгын дугаар: <strong>{order.orderNumber}</strong>. Төлбөр одоогоор <strong>төлөгдөөгүй</strong> төлөвтэй. Манай ажилтан бичгээр баталгаажуулж, мэдэгдэл илгээнэ.</p>
        </div>
      )}
      <h1 className="text-3xl font-bold">Захиалга {order.orderNumber}</h1>
      <p className="mt-2 text-lg">Төлөв: <strong>{ORDER_STATUS_LABELS[order.status]}</strong></p>

      <section aria-labelledby="progress" className="card mt-6 p-5">
        <h2 id="progress" className="text-xl font-bold">Захиалгын явц</h2>
        {order.status === "cancelled" ? (
          <p className="mt-2">Энэ захиалга цуцлагдсан.</p>
        ) : (
          <ol className="mt-3 space-y-1">
            {ORDER_STATUS_FLOW.map((s, i) => (
              <li key={s} aria-current={i === stepIndex ? "step" : undefined}>
                <span aria-hidden="true">{i < stepIndex ? "✔ " : i === stepIndex ? "● " : "○ "}</span>
                <span className={i === stepIndex ? "font-bold" : ""}>{ORDER_STATUS_LABELS[s]}</span>
                <span className="sr-only">{i < stepIndex ? " — дууссан" : i === stepIndex ? " — одоогийн алхам" : " — хүлээгдэж байна"}</span>
              </li>
            ))}
          </ol>
        )}
        <h3 className="mt-4 font-bold">Түүх</h3>
        <ul className="mt-1 space-y-1" role="list">
          {history.map((h) => (
            <li key={h.id}>{formatDateTime(h.createdAt)} — {ORDER_STATUS_LABELS[h.status]}{h.note ? `. ${h.note}` : ""}</li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="items" className="card mt-6 p-5">
        <h2 id="items" className="text-xl font-bold">Бараа</h2>
        <div className="table-wrap mt-2">
          <table className="data-table">
            <caption className="sr-only">Захиалсан бараа</caption>
            <thead><tr><th scope="col">Бараа</th><th scope="col">Нэгж үнэ</th><th scope="col">Тоо</th><th scope="col">Дүн</th></tr></thead>
            <tbody>
              {items.map((i) => (
                <tr key={i.id}><th scope="row" className="font-normal">{i.productName}</th><td>{formatMnt(i.unitPriceMnt)}</td><td>{i.quantity}</td><td>{formatMnt(i.unitPriceMnt * i.quantity)}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
        <dl className="mt-3 grid grid-cols-[1fr_auto] gap-x-6 gap-y-1">
          <dt>Барааны дүн</dt><dd>{formatMnt(order.subtotalMnt)}</dd>
          <dt>Хүргэлт ({order.deliveryMethodName})</dt><dd>{formatMnt(order.deliveryFeeMnt)}</dd>
          <dt className="font-bold">Нийт дүн</dt><dd className="font-bold">{formatMnt(order.totalMnt)}</dd>
        </dl>
      </section>

      <section aria-labelledby="pay" className="card mt-6 p-5">
        <h2 id="pay" className="text-xl font-bold">Төлбөр, хүргэлт</h2>
        <dl className="mt-2 space-y-1">
          <div><dt className="inline font-semibold">Төлбөрийн хэлбэр: </dt><dd className="inline">{PAYMENT_METHOD_LABELS[order.paymentMethod]}</dd></div>
          <div><dt className="inline font-semibold">Төлбөрийн төлөв: </dt><dd className="inline">{payment ? PAYMENT_STATUS_LABELS[payment.status] : "—"}</dd></div>
          <div><dt className="inline font-semibold">Хүргэлтийн төлөв: </dt><dd className="inline">{delivery ? DELIVERY_STATUS_LABELS[delivery.status] : "—"}</dd></div>
          {delivery?.trackingInfo && <div><dt className="inline font-semibold">Хүргэлтийн мэдээлэл: </dt><dd className="inline">{delivery.trackingInfo}</dd></div>}
          {order.addressLine && <div><dt className="inline font-semibold">Хаяг: </dt><dd className="inline">{[order.city, order.district, order.khoroo && `${order.khoroo}-р хороо`, order.addressLine].filter(Boolean).join(", ")}</dd></div>}
          <div><dt className="inline font-semibold">Холбогдох хэлбэр: </dt><dd className="inline">{CONTACT_PREFERENCE_LABELS[order.contactPreference]}</dd></div>
        </dl>
      </section>

      {order.status === "created" && (
        <section aria-labelledby="cancel" className="card mt-6 p-5">
          <h2 id="cancel" className="mb-3 text-xl font-bold">Захиалга цуцлах</h2>
          <CancelOrderForm orderId={order.id} />
        </section>
      )}
      <p className="mt-6"><Link href="/help" className="underline">Захиалгын талаар бичгээр асуух</Link></p>
    </div>
  );
}
