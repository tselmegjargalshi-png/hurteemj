import { asc, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { accessiblePlaces, accessibilityFeatures, placeEditSuggestions } from "@/db/schema";
import { PlaceForm, SuggestionForm } from "@/components/admin-forms2";
import { formatDateTime } from "@/lib/format";

export const metadata = { title: "Админ: хүртээмжтэй газар" };

export default async function AdminPlaces() {
  const places = await db.select().from(accessiblePlaces).orderBy(asc(accessiblePlaces.isPublished), desc(accessiblePlaces.createdAt));
  const feats = await db.select().from(accessibilityFeatures);
  const sugg = await db
    .select({ s: placeEditSuggestions, place: accessiblePlaces.name })
    .from(placeEditSuggestions)
    .leftJoin(accessiblePlaces, eq(accessiblePlaces.id, placeEditSuggestions.placeId))
    .where(eq(placeEditSuggestions.status, "new"))
    .orderBy(desc(placeEditSuggestions.createdAt));
  const byPlace = new Map<string, Record<string, string>>();
  for (const f of feats) byPlace.set(f.placeId, { ...(byPlace.get(f.placeId) ?? {}), [f.feature]: f.value });
  return (
    <div>
      <h1 className="text-3xl font-bold">Хүртээмжтэй газар</h1>
      <h2 className="mt-6 text-2xl font-bold">Засварын санал ({sugg.length})</h2>
      {sugg.length === 0 ? <p className="notice notice-info mt-3">Шинэ санал алга.</p> : (
        <ul className="mt-3 space-y-3">{sugg.map(({ s, place }) => <li key={s.id} className="card p-4"><p className="font-bold">{place ?? "Шинэ газрын санал"} — {formatDateTime(s.createdAt)}</p><p className="whitespace-pre-line">{s.body}</p><SuggestionForm id={s.id} /></li>)}</ul>
      )}
      <h2 className="mt-8 text-2xl font-bold">Газрууд</h2>
      {places.map((p) => <details key={p.id} className="card mt-3 p-4"><summary className="cursor-pointer font-bold">{p.name} — {p.isPublished ? "нийтлэгдсэн" : "нийтлээгүй"}</summary><div className="mt-4"><PlaceForm p={p} features={byPlace.get(p.id)} /></div></details>)}
      <details className="card mt-3 p-4"><summary className="cursor-pointer font-bold">Шинэ газар нэмэх</summary><div className="mt-4"><PlaceForm /></div></details>
    </div>
  );
}
