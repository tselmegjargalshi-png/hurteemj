import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { accessibilityFeatures, accessiblePlaces, placePhotos } from "@/db/schema";
import { PlaceEditForm } from "@/components/place-forms";
import { getCurrentUser } from "@/lib/auth";
import { formatDate } from "@/lib/format";
import { FEATURE_VALUE_LABELS, PLACE_FEATURE_LABELS, PLACE_TYPE_LABELS, VERIFICATION_LABELS } from "@/lib/labels";

export const metadata = { title: "Газрын мэдээлэл" };

export default async function PlacePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) notFound();
  const p = (await db.select().from(accessiblePlaces).where(eq(accessiblePlaces.id, id)).limit(1))[0];
  if (!p || !p.isPublished) notFound();
  const [feats, photos, user] = await Promise.all([
    db.select().from(accessibilityFeatures).where(eq(accessibilityFeatures.placeId, id)),
    db.select().from(placePhotos).where(eq(placePhotos.placeId, id)),
    getCurrentUser(),
  ]);
  return (
    <div className="mx-auto max-w-3xl">
      <p className="text-muted">{PLACE_TYPE_LABELS[p.type]}</p>
      <h1 className="text-3xl font-bold">{p.name}</h1>
      <p className="mt-2">Хаяг: {p.address}{p.district && `, ${p.district}`}</p>
      {p.latitude != null && p.longitude != null && <p>Координат: {p.latitude}, {p.longitude} (газрын зураг холбогдоогүй)</p>}
      <p className="mt-2"><span className="badge">{VERIFICATION_LABELS[p.verificationStatus]}</span></p>
      <dl className="mt-2 text-muted">
        <div><dt className="inline font-semibold">Мэдээллийн эх сурвалж: </dt><dd className="inline">{p.source || "заагаагүй"}</dd></div>
        <div><dt className="inline font-semibold">Сүүлд баталгаажуулсан: </dt><dd className="inline">{p.lastVerifiedAt ? formatDate(p.lastVerifiedAt) : "хэзээ ч баталгаажуулаагүй"}</dd></div>
      </dl>
      {p.description && <p className="mt-4 whitespace-pre-line">{p.description}</p>}
      <section aria-labelledby="feat" className="mt-6">
        <h2 id="feat" className="text-xl font-bold">Хүртээмжийн мэдээлэл</h2>
        <div className="table-wrap mt-2"><table className="data-table"><caption className="sr-only">Хүртээмжийн боломжууд</caption>
          <thead><tr><th scope="col">Боломж</th><th scope="col">Байдал</th><th scope="col">Тэмдэглэл</th></tr></thead>
          <tbody>{(Object.keys(PLACE_FEATURE_LABELS) as (keyof typeof PLACE_FEATURE_LABELS)[]).map((k) => {
            const f = feats.find((x) => x.feature === k);
            return <tr key={k}><th scope="row">{PLACE_FEATURE_LABELS[k]}</th><td>{FEATURE_VALUE_LABELS[f?.value ?? "unknown"]}</td><td>{f?.note ?? ""}</td></tr>;
          })}</tbody></table></div>
      </section>
      {photos.length > 0 && (
        <section aria-labelledby="ph" className="mt-6"><h2 id="ph" className="text-xl font-bold">Зураг</h2>
          <ul className="mt-2 grid gap-3 sm:grid-cols-2" role="list">{photos.map((ph) => (
            <li key={ph.id}><figure className="card overflow-hidden">{/* eslint-disable-next-line @next/next/no-img-element */}<img src={ph.url} alt={ph.alt} className="w-full object-cover" />{ph.credit && <figcaption className="px-3 py-1 text-sm text-muted">Эх сурвалж: {ph.credit}</figcaption>}</figure></li>
          ))}</ul></section>
      )}
      <section aria-labelledby="edit" className="card mt-8 p-5"><h2 id="edit" className="mb-3 text-xl font-bold">Мэдээлэл засах санал</h2>
        {user ? <PlaceEditForm placeId={p.id} /> : <p><Link href={`/login?next=/places/${p.id}`} className="underline">Нэвтэрч</Link> засвар санал болгох боломжтой.</p>}</section>
      <p className="mt-6"><Link href="/places" className="underline">Бүх газар</Link></p>
    </div>
  );
}
