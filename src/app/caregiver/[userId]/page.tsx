import { notFound } from "next/navigation";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { caregiverLinks, orders, serviceBookings, serviceListings, supportRequests, users } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { formatDateTime, formatMnt } from "@/lib/format";
import { BOOKING_STATUS_LABELS, ORDER_STATUS_LABELS, SUPPORT_STATUS_LABELS } from "@/lib/labels";

export const metadata = { title: "Асран хамгаалагчийн харагдац" };

export default async function CaregiverView({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params;
  if (!z.string().uuid().safeParse(userId).success) notFound();
  const me = await requireUser(`/caregiver/${userId}`);
  // Сервер талд: идэвхтэй холбоос байгаа эсэхийг шалгана. Эрх бүрийг тусад нь шалгана.
  const link = (await db.select().from(caregiverLinks).where(and(eq(caregiverLinks.userId, userId), eq(caregiverLinks.caregiverId, me.id), eq(caregiverLinks.status, "active"))).limit(1))[0];
  if (!link) notFound();
  const person = (await db.select({ name: users.name }).from(users).where(eq(users.id, userId)).limit(1))[0];
  const [ord, bk, sup] = await Promise.all([
    link.canViewOrders ? db.select().from(orders).where(eq(orders.userId, userId)).orderBy(desc(orders.createdAt)).limit(20) : [],
    link.canViewBookings ? db.select({ b: serviceBookings, name: serviceListings.name }).from(serviceBookings).innerJoin(serviceListings, eq(serviceListings.id, serviceBookings.listingId)).where(eq(serviceBookings.userId, userId)).orderBy(desc(serviceBookings.requestedAt)).limit(20) : [],
    link.canViewSupport ? db.select().from(supportRequests).where(eq(supportRequests.userId, userId)).orderBy(desc(supportRequests.createdAt)).limit(20) : [],
  ]);
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-3xl font-bold">{person?.name}</h1>
      <p className="mt-2 text-muted">Зөвхөн {person?.name}-ийн зөвшөөрсөн мэдээлэл харагдана.</p>
      {!link.canViewOrders && !link.canViewBookings && !link.canViewSupport && <p className="notice notice-info mt-4">Одоогоор ямар ч мэдээлэл харуулахыг зөвшөөрөөгүй байна.</p>}
      {link.canViewOrders && <section aria-labelledby="o" className="mt-6"><h2 id="o" className="text-xl font-bold">Захиалгууд</h2>{ord.length === 0 ? <p>Алга.</p> : <ul className="mt-2 space-y-2" role="list">{ord.map((o) => <li key={o.id} className="card p-3">{o.orderNumber} · {ORDER_STATUS_LABELS[o.status]} · {formatMnt(o.totalMnt)} · {formatDateTime(o.createdAt)}</li>)}</ul>}</section>}
      {link.canViewBookings && <section aria-labelledby="b" className="mt-6"><h2 id="b" className="text-xl font-bold">Үйлчилгээний цагийн хуваарь</h2>{bk.length === 0 ? <p>Алга.</p> : <ul className="mt-2 space-y-2" role="list">{bk.map(({ b, name }) => <li key={b.id} className="card p-3">{name} · {formatDateTime(b.requestedAt)} · {BOOKING_STATUS_LABELS[b.status]}</li>)}</ul>}</section>}
      {link.canViewSupport && <section aria-labelledby="s" className="mt-6"><h2 id="s" className="text-xl font-bold">Тусламжийн хүсэлтүүд</h2>{sup.length === 0 ? <p>Алга.</p> : <ul className="mt-2 space-y-2" role="list">{sup.map((r) => <li key={r.id} className="card p-3">{r.referenceNumber} · {r.subject} · {SUPPORT_STATUS_LABELS[r.status]}</li>)}</ul>}</section>}
    </div>
  );
}
