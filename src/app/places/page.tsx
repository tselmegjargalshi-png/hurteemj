import Link from "next/link";
import { and, asc, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { accessibilityFeatures, accessiblePlaces } from "@/db/schema";
import { formatDate } from "@/lib/format";
import { PLACE_FEATURE_LABELS, PLACE_TYPE_LABELS, VERIFICATION_LABELS } from "@/lib/labels";

export const metadata = { title: "Хүртээмжтэй газар" };
export const dynamic = "force-dynamic";

export default async function PlacesPage({ searchParams }: { searchParams: Promise<{ type?: string; q?: string; feature?: string | string[]; submitted?: string }> }) {
  const sp = await searchParams;
  const type = sp.type && sp.type in PLACE_TYPE_LABELS ? (sp.type as keyof typeof PLACE_TYPE_LABELS) : undefined;
  const wanted = ([] as string[]).concat(sp.feature ?? []).filter((f): f is keyof typeof PLACE_FEATURE_LABELS => f in PLACE_FEATURE_LABELS);
  const places = await db.select().from(accessiblePlaces).where(and(eq(accessiblePlaces.isPublished, true), type ? eq(accessiblePlaces.type, type) : undefined)).orderBy(asc(accessiblePlaces.name));
  const feats = places.length ? await db.select().from(accessibilityFeatures).where(inArray(accessibilityFeatures.placeId, places.map((p) => p.id))) : [];
  const q = sp.q?.trim().toLowerCase();
  const items = places.filter((p) => {
    if (q && !`${p.name} ${p.address} ${p.district ?? ""} ${p.description}`.toLowerCase().includes(q)) return false;
    return wanted.every((w) => feats.some((f) => f.placeId === p.id && f.feature === w && f.value === "yes"));
  });
  return (
    <div>
      <h1 className="text-3xl font-bold">Хүртээмжтэй газрын сан</h1>
      {sp.submitted === "1" && <p role="status" className="notice notice-success mt-4 font-semibold">Таны санал болгосон газар хүлээн авлаа. Администратор шалгасны дараа нийтлэгдэнэ.</p>}
      <p className="notice notice-warning mt-4">Газар бүрийн мэдээллийн эх сурвалж, баталгаажуулсан огноог тусад нь харуулна. «Баталгаажаагүй» мэдээлэлд найдахаасаа өмнө өөрөө лавлана уу.</p>
      <form method="get" role="search" aria-label="Газар хайх" className="card mt-6 space-y-4 p-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <div><label htmlFor="q" className="field-label">Хайх үг</label><input id="q" name="q" type="search" defaultValue={sp.q} className="field-input" /></div>
          <div><label htmlFor="type" className="field-label">Төрөл</label>
            <select id="type" name="type" defaultValue={type ?? ""} className="field-input"><option value="">Бүгд</option>{Object.entries(PLACE_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></div>
        </div>
        <fieldset><legend className="field-label">Заавал байх хүртээмж</legend>
          <div className="grid gap-x-6 sm:grid-cols-2">{Object.entries(PLACE_FEATURE_LABELS).map(([k, v]) => (
            <label key={k} className="check-row"><input type="checkbox" name="feature" value={k} defaultChecked={wanted.includes(k as never)} /><span>{v}</span></label>
          ))}</div></fieldset>
        <button type="submit" className="btn btn-primary">Хайх</button>
      </form>
      <p className="mt-4" role="status">{items.length} газар олдлоо. <Link href="/places/new" className="underline">Шинэ газар санал болгох</Link></p>
      {items.length === 0 ? <p className="notice notice-info mt-4">Бүртгэлтэй газар одоогоор байхгүй. Та мэддэг газраа санал болгож болно.</p> : (
        <ul className="mt-4 grid gap-4 md:grid-cols-2" role="list">
          {items.map((p) => (
            <li key={p.id} className="card p-5">
              <p className="text-sm text-muted">{PLACE_TYPE_LABELS[p.type]}</p>
              <h2 className="text-xl font-bold"><Link href={`/places/${p.id}`} className="text-fg underline">{p.name}</Link></h2>
              <p>{p.address}</p>
              <p className="mt-1"><span className="badge">{VERIFICATION_LABELS[p.verificationStatus]}</span>{p.lastVerifiedAt && ` · ${formatDate(p.lastVerifiedAt)}`}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
