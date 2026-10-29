import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { serviceListings, serviceProviders } from "@/db/schema";
import { BookingForm } from "@/components/booking-forms";
import { getCurrentUser } from "@/lib/auth";
import { formatMnt } from "@/lib/format";
import { SERVICE_CATEGORY_LABELS } from "@/lib/labels";

export const metadata = { title: "Үйлчилгээний дэлгэрэнгүй" };

export default async function ServicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) notFound();
  const row = (await db.select({ l: serviceListings, p: serviceProviders }).from(serviceListings).innerJoin(serviceProviders, eq(serviceProviders.id, serviceListings.providerId)).where(eq(serviceListings.id, id)).limit(1))[0];
  if (!row || !row.l.isActive || !row.p.isActive) notFound();
  const { l, p } = row;
  const user = await getCurrentUser();
  return (
    <div className="mx-auto max-w-3xl">
      <p className="text-muted">{SERVICE_CATEGORY_LABELS[l.category]}</p>
      <h1 className="text-3xl font-bold">{l.name}</h1>
      <dl className="card mt-4 grid gap-1 p-5">
        <div><dt className="inline font-semibold">Үйлчилгээ үзүүлэгч: </dt><dd className="inline">{p.name} <span className="badge">{p.verified ? "Баталгаажсан" : "Баталгаажаагүй"}</span></dd></div>
        <div><dt className="inline font-semibold">Үнэ: </dt><dd className="inline">{l.priceMnt != null ? formatMnt(l.priceMnt) : l.priceTerms || "тохиролцоно"}</dd></div>
        {l.priceMnt != null && l.priceTerms && <div><dt className="inline font-semibold">Үнийн нөхцөл: </dt><dd className="inline">{l.priceTerms}</dd></div>}
        {l.location && <div><dt className="inline font-semibold">Байршил: </dt><dd className="inline">{l.location}</dd></div>}
        {l.schedule && <div><dt className="inline font-semibold">Цаг: </dt><dd className="inline">{l.schedule}</dd></div>}
        {p.phone && <div><dt className="inline font-semibold">Утас: </dt><dd className="inline">{p.phone}</dd></div>}
        {p.email && <div><dt className="inline font-semibold">Имэйл: </dt><dd className="inline">{p.email}</dd></div>}
      </dl>
      {l.description && <p className="mt-4 whitespace-pre-line">{l.description}</p>}
      {!p.verified && <p className="notice notice-warning mt-4">Энэ үйлчилгээ үзүүлэгчийн бүртгэлийг манай администратор хараахан баталгаажуулаагүй байна.</p>}
      <section aria-labelledby="book" className="card mt-6 p-5">
        <h2 id="book" className="mb-3 text-xl font-bold">Үйлчилгээ захиалах</h2>
        {user ? <BookingForm listingId={l.id} /> : <p><Link href={`/login?next=/services/${l.id}`} className="underline">Нэвтэрч</Link> захиалах боломжтой.</p>}
      </section>
      <p className="mt-6"><Link href="/services" className="underline">Бүх үйлчилгээ</Link></p>
    </div>
  );
}
