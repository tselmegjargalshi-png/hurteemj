import "server-only";
import { and, desc, eq, ilike, or } from "drizzle-orm";
import { db } from "@/db";
import { accessiblePlaces, categories, products, serviceListings, serviceProviders } from "@/db/schema";
import { formatMnt } from "./format";
import { getSetting } from "./settings";

export type Source = { kind: "product" | "service" | "place"; title: string; href: string; detail: string };

const STOP = new Set(["байна", "уу", "үү", "юу", "ямар", "надад", "хэрэгтэй", "хэд", "бол", "байгаа", "байдаг", "болон", "тухай", "авах", "хайж"]);

function keywords(q: string) {
  return Array.from(new Set(q.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, " ").split(/\s+/).filter((w) => w.length >= 3 && !STOP.has(w)))).slice(0, 5);
}
const esc = (s: string) => s.replace(/[\\%_]/g, (m) => `\\${m}`);

/** Зөвхөн сайтын бодит өгөгдлөөс хайна. Олдохгүй бол юу ч зохиохгүй. */
export async function retrieve(question: string): Promise<Source[]> {
  const kws = keywords(question);
  if (!kws.length) return [];
  const likeAny = (cols: Parameters<typeof ilike>[0][]) => or(...kws.flatMap((k) => cols.map((c) => ilike(c, `%${esc(k)}%`))));
  const [prods, svcs, places] = await Promise.all([
    db.select({ slug: products.slug, name: products.name, price: products.priceMnt, verified: products.priceVerified, stock: products.stock, summary: products.summary })
      .from(products).innerJoin(categories, eq(categories.id, products.categoryId))
      .where(and(eq(products.status, "published"), likeAny([products.name, products.summary, products.description, products.suitableFor, categories.name]))).orderBy(desc(products.createdAt)).limit(5),
    db.select({ id: serviceListings.id, name: serviceListings.name, provider: serviceProviders.name, price: serviceListings.priceMnt, terms: serviceListings.priceTerms })
      .from(serviceListings).innerJoin(serviceProviders, eq(serviceProviders.id, serviceListings.providerId))
      .where(and(eq(serviceListings.isActive, true), eq(serviceProviders.isActive, true), likeAny([serviceListings.name, serviceListings.description]))).limit(4),
    db.select({ id: accessiblePlaces.id, name: accessiblePlaces.name, address: accessiblePlaces.address, v: accessiblePlaces.verificationStatus })
      .from(accessiblePlaces).where(and(eq(accessiblePlaces.isPublished, true), likeAny([accessiblePlaces.name, accessiblePlaces.description, accessiblePlaces.address]))).limit(4),
  ]);
  return [
    ...prods.map((p): Source => ({ kind: "product", title: p.name, href: `/products/${p.slug}`, detail: `${formatMnt(p.price)}${p.verified ? "" : " (үнэ баталгаажаагүй)"}; ${p.stock > 0 ? `нөөцөд ${p.stock} ширхэг` : "дууссан"}. ${p.summary}` })),
    ...svcs.map((s): Source => ({ kind: "service", title: `${s.name} — ${s.provider}`, href: `/services/${s.id}`, detail: s.price != null ? formatMnt(s.price) : s.terms || "үнэ тохиролцоно" })),
    ...places.map((p): Source => ({ kind: "place", title: p.name, href: `/places/${p.id}`, detail: `${p.address}${p.v === "verified" ? "" : " (хүртээмжийн мэдээлэл баталгаажаагүй)"}` })),
  ];
}

const SYSTEM = `Та "Хүртээмж" платформын Монгол хэлээр ажилладаг туслах. Зөвхөн Монгол хэлээр, энгийн, богино, ойлгомжтой хариулна.
ДҮРЭМ:
- Зөвхөн доор өгөгдсөн "Сайтын мэдээлэл"-д байгаа бүтээгдэхүүн, үйлчилгээ, газрыг дурдана. Өгөгдөөгүй үнэ, нөөц, бүтээгдэхүүн, үйлчилгээ үүсгэхгүй. Олдохгүй бол олдоогүй гэж шударгаар хэлж, /help хуудсаар бичгээр тусламж хүсэхийг зөвлөнө.
- Оношлохгүй, эмчилгээ зөвлөхгүй, хэрэглэгчийн хөгжлийн бэрхшээлийн төрлийг таамаглахгүй, асуухгүй. Эрүүл мэндийн асуудал бол эмчид хандахыг хэлнэ. Яаралтай үед 103 (түргэн тусламж), 105 (аврах алба), 102 (цагдаа) руу залгахыг хэлнэ.
- Та захиалга өгөх, төлбөр хийх, өгөгдөл өөрчлөх боломжгүй. Тийм үйлдлийг хийсэн мэт хэлэхгүй; хэрэглэгчийг холбогдох хуудас руу чиглүүлнэ.
- Үнэ "баталгаажаагүй" гэж тэмдэглэсэн бол заавал хэлнэ.`;

export type AssistantAnswer = { mode: "ai" | "search_only"; text: string; sources: Source[]; reason?: string };

export async function answer(question: string): Promise<AssistantAnswer> {
  const sources = await retrieve(question);
  const cfg = await getSetting("assistant_config");
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key || cfg?.enabled === false) {
    return {
      mode: "search_only",
      sources,
      reason: !key ? "AI үйлчилгээ холбогдоогүй (API түлхүүр тохируулаагүй)." : "AI туслахыг администратор идэвхгүй болгосон.",
      text: sources.length
        ? "AI туслах одоогоор ажиллахгүй байна. Таны асуултад тохирох сайтын мэдээллийг энгийн хайлтаар доор жагсаалаа."
        : "AI туслах одоогоор ажиллахгүй байна, мөн таны асуултад тохирох мэдээлэл сайтаас олдсонгүй. Өөр үгээр хайх эсвэл бичгээр тусламж хүсээрэй.",
    };
  }
  const context = sources.length ? sources.map((s, i) => `${i + 1}. [${s.kind}] ${s.title} — ${s.detail} (${s.href})`).join("\n") : "(олдсонгүй)";
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "content-type": "application/json", "x-api-key": key, "anthropic-version": "2023-06-01" },
    body: JSON.stringify({
      model: process.env.AI_MODEL || "claude-sonnet-5-5",
      max_tokens: 600,
      system: `${SYSTEM}${cfg?.extraInstructions ? `\n\nНэмэлт заавар (администратор):\n${cfg.extraInstructions}` : ""}`,
      messages: [{ role: "user", content: `Сайтын мэдээлэл:\n${context}\n\nХэрэглэгчийн асуулт: ${question}` }],
    }),
    signal: AbortSignal.timeout(25_000),
  });
  if (!res.ok) {
    console.error("assistant api error", res.status);
    return { mode: "search_only", sources, reason: "AI үйлчилгээнд түр алдаа гарлаа.", text: "AI туслахтай холбогдож чадсангүй. Энгийн хайлтын үр дүнг доор харуулав." };
  }
  const data = (await res.json()) as { content?: { type: string; text?: string }[] };
  const text = data.content?.filter((c) => c.type === "text").map((c) => c.text).join("\n").trim();
  return { mode: "ai", text: text || "Хариулт авч чадсангүй.", sources };
}
