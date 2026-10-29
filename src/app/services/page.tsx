import Link from "next/link";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { serviceListings, serviceProviders } from "@/db/schema";
import { formatMnt } from "@/lib/format";
import { SERVICE_CATEGORY_LABELS } from "@/lib/labels";

export const metadata = { title: "Үйлчилгээ" };
export const dynamic = "force-dynamic";

export default async function ServicesPage({ searchParams }: { searchParams: Promise<{ category?: string; q?: string }> }) {
  const sp = await searchParams;
  const cat = sp.category && sp.category in SERVICE_CATEGORY_LABELS ? (sp.category as keyof typeof SERVICE_CATEGORY_LABELS) : undefined;
  const rows = await db
    .select({ l: serviceListings, p: serviceProviders })
    .from(serviceListings)
    .innerJoin(serviceProviders, eq(serviceProviders.id, serviceListings.providerId))
    .where(and(eq(serviceListings.isActive, true), eq(serviceProviders.isActive, true), cat ? eq(serviceListings.category, cat) : undefined))
    .orderBy(desc(serviceProviders.verified), desc(serviceListings.createdAt));
  const q = sp.q?.trim().toLowerCase();
  const items = q ? rows.filter((r) => `${r.l.name} ${r.l.description} ${r.l.location} ${r.p.name}`.toLowerCase().includes(q)) : rows;
  return (
    <div>
      <h1 className="text-3xl font-bold">Үйлчилгээ</h1>
      <p className="mt-2 text-lg">Сэргээн засах, засвар, гэрийн туслах, тээвэр, дохионы хэлний орчуулагч зэрэг үйлчилгээ.</p>
      <form method="get" role="search" aria-label="Үйлчилгээ хайх" className="card mt-6 flex flex-wrap items-end gap-3 p-4">
        <div className="flex-1 basis-56"><label htmlFor="q" className="field-label">Хайх үг</label><input id="q" name="q" type="search" defaultValue={sp.q} className="field-input" /></div>
        <div className="basis-72"><label htmlFor="category" className="field-label">Төрөл</label>
          <select id="category" name="category" defaultValue={cat ?? ""} className="field-input"><option value="">Бүх төрөл</option>{Object.entries(SERVICE_CATEGORY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></div>
        <button type="submit" className="btn btn-primary">Хайх</button>
      </form>
      <p className="mt-4" role="status">{items.length} үйлчилгээ олдлоо.</p>
      {items.length === 0 ? (
        <p className="notice notice-info mt-4">Одоогоор бүртгэлтэй үйлчилгээ байхгүй. Бид зөвхөн бодит үйлчилгээ үзүүлэгчийг бүртгэнэ. Үйлчилгээ хэрэгтэй бол <Link href="/help" className="underline">бичгээр тусламж хүсээрэй</Link>.</p>
      ) : (
        <ul className="mt-4 grid gap-4 md:grid-cols-2" role="list">
          {items.map(({ l, p }) => (
            <li key={l.id} className="card p-5">
              <p className="text-sm text-muted">{SERVICE_CATEGORY_LABELS[l.category]}</p>
              <h2 className="text-xl font-bold"><Link href={`/services/${l.id}`} className="text-fg underline">{l.name}</Link></h2>
              <p className="mt-1">Үзүүлэгч: {p.name} <span className="badge ml-1">{p.verified ? "Баталгаажсан" : "Баталгаажаагүй"}</span></p>
              <p>{l.priceMnt != null ? `Үнэ: ${formatMnt(l.priceMnt)}` : l.priceTerms ? `Үнийн нөхцөл: ${l.priceTerms}` : "Үнэ: тохиролцоно"}</p>
              {l.location && <p>Байршил: {l.location}</p>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
