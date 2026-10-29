import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { reviews, wishlistItems } from "@/db/schema";
import { findEligibleOrder } from "@/app/actions/reviews";
import { AddToCartForm, WishlistForm } from "@/components/cart-forms";
import { Price, StockStatus } from "@/components/price";
import { ProductGrid } from "@/components/product-card";
import { ReviewForm } from "@/components/review-form";
import { getCurrentUser } from "@/lib/auth";
import { formatDate, formatMnt } from "@/lib/format";
import { getPreferences } from "@/lib/preferences";
import { getProductBySlug } from "@/lib/products";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const p = await getProductBySlug((await params).slug);
  return { title: p ? p.name : "Бүтээгдэхүүн олдсонгүй", description: p?.summary };
}

function Section({ id, title, children, open }: { id: string; title: string; children: React.ReactNode; open: boolean }) {
  return (
    <details className="card p-0" open={open}>
      <summary className="flex min-h-[var(--target)] cursor-pointer items-center px-5 py-3 text-lg font-bold" id={id}>
        {title}
      </summary>
      <div className="whitespace-pre-line border-t border-border-soft px-5 py-4">{children}</div>
    </details>
  );
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const p = await getProductBySlug(slug);
  if (!p) notFound();
  const [user, { prefs }] = await Promise.all([getCurrentUser(), getPreferences()]);
  const [saved, canReview, alreadyReviewed] = user
    ? await Promise.all([
        db.select().from(wishlistItems).where(and(eq(wishlistItems.userId, user.id), eq(wishlistItems.productId, p.id))).limit(1).then((r) => r.length > 0),
        findEligibleOrder(user.id, p.id).then(Boolean),
        db.select({ id: reviews.id }).from(reviews).where(and(eq(reviews.userId, user.id), eq(reviews.productId, p.id))).limit(1).then((r) => r.length > 0),
      ])
    : [false, false, false];
  // Дэлгэц уншигчийн горим болон энгийн хэллэгийн горимд бүх хэсэг нээлттэй — нэмэлт товшилт шаардахгүй.
  const openAll = prefs.screenReaderMode || prefs.simpleLanguage;

  return (
    <div>
      <nav aria-label="Байршил" className="mb-4 text-sm">
        <ol className="flex flex-wrap gap-2">
          <li><Link href="/" className="underline">Нүүр</Link> <span aria-hidden="true">/</span></li>
          <li><Link href="/products" className="underline">Дэлгүүр</Link> <span aria-hidden="true">/</span></li>
          <li><Link href={`/products?category=${p.category.slug}`} className="underline">{p.category.name}</Link> <span aria-hidden="true">/</span></li>
          <li aria-current="page">{p.name}</li>
        </ol>
      </nav>

      <div className="grid gap-8 lg:grid-cols-2">
        <section aria-label="Бүтээгдэхүүний зураг">
          {p.images.length ? (
            <ul className="grid gap-3" role="list">
              {p.images.map((img, i) => (
                <li key={img.id}>
                  <figure className="card overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img.url} alt={img.alt} className="aspect-[4/3] w-full bg-surface-2 object-contain" loading={i === 0 ? "eager" : "lazy"} />
                    {(img.credit || img.isAiGenerated) && (
                      <figcaption className="px-4 py-2 text-sm text-muted">
                        {img.isAiGenerated && <strong>AI-аар бүтээсэн зураг — бодит бүтээгдэхүүний зураг биш. </strong>}
                        {img.credit && `Эх сурвалж: ${img.credit}`}
                      </figcaption>
                    )}
                  </figure>
                </li>
              ))}
            </ul>
          ) : (
            <div className="card flex aspect-[4/3] items-center justify-center text-muted">Зураг оруулаагүй</div>
          )}
        </section>

        <section aria-labelledby="product-title">
          <p className="text-muted">{p.category.name}</p>
          <h1 id="product-title" className="mt-1 text-3xl font-bold">{p.name}</h1>
          {p.condition === "used_inspected" && <p className="badge mt-2">Шалгагдсан хуучин бүтээгдэхүүн</p>}
          {p.rating && (
            <p className="mt-2">
              Дундаж үнэлгээ: <strong>{p.rating.average.toFixed(1)} / 5</strong> ({p.rating.count} үнэлгээ)
            </p>
          )}
          {p.summary && <p className="mt-4 text-lg">{p.summary}</p>}
          <div className="mt-6 space-y-2">
            <Price value={p.priceMnt} verified={p.priceVerified} size="lg" />
            {!p.priceVerified && (
              <p className="text-sm text-muted">Үнийг нийлүүлэгчтэй эцэслэн баталгаажуулаагүй. Захиалгыг баталгаажуулахаас өмнө манай ажилтан бичгээр мэдэгдэнэ.</p>
            )}
            <p><StockStatus stock={p.stock} /></p>
            {p.supplierName && <p className="text-muted">Нийлүүлэгч: {p.supplierName}</p>}
          </div>
          {p.stock > 0 ? (
            <AddToCartForm productId={p.id} productName={p.name} maxQty={p.stock} />
          ) : (
            <p className="notice notice-warning mt-6">Энэ бүтээгдэхүүн дууссан. <Link href="/help" className="underline">Тусламж хүсэх</Link> хэсгээр нөөцөд орох эсэхийг асууж болно.</p>
          )}
          <div className="mt-3 flex flex-wrap gap-3">
            {user ? (
              <WishlistForm productId={p.id} saved={saved} loggedIn />
            ) : (
              <p className="text-sm">
                <Link href={`/login?next=/products/${p.slug}`} className="underline">Нэвтэрч</Link> хадгалах жагсаалтад нэмэх боломжтой.
              </p>
            )}
          </div>
        </section>
      </div>

      <div className="mt-10 space-y-3">
        {p.description && <Section id="s-desc" title="Тайлбар" open>{p.description}</Section>}
        {p.usage && <Section id="s-usage" title="Хэрэглээ" open={openAll}>{p.usage}</Section>}
        {p.specifications.length > 0 && (
          <Section id="s-specs" title="Хэмжээ, материал, техникийн үзүүлэлт" open={openAll}>
            <table className="data-table">
              <caption className="sr-only">Техникийн үзүүлэлт</caption>
              <tbody>
                {p.specifications.map((s, i) => (
                  <tr key={i}>
                    <th scope="row">{s.label}</th>
                    <td>{s.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Section>
        )}
        {p.suitableFor && <Section id="s-for" title="Хэнд тохиромжтой" open={openAll}>{p.suitableFor}</Section>}
        {p.cautions && <Section id="s-caution" title="Хэрэглэхэд анхаарах зүйл" open>{p.cautions}</Section>}
        <Section id="s-delivery" title="Хүргэлтийн нөхцөл" open={openAll}>
          {p.deliveryInfo || <>Ерөнхий нөхцөл: <Link href="/info/delivery" className="underline">Хүргэлтийн нөхцөл</Link></>}
        </Section>
        <Section id="s-warranty" title="Баталгаа, буцаалтын нөхцөл" open={openAll}>
          {[p.warrantyInfo, p.returnPolicy].filter(Boolean).join("\n\n") || <>Ерөнхий нөхцөл: <Link href="/info/returns" className="underline">Буцаалт, баталгаа</Link></>}
        </Section>
        {p.rentalPricePerDayMnt != null && (
          <Section id="s-rental" title="Түрээсийн нөхцөл" open>
            {`Түрээсийн үнэ: ${formatMnt(p.rentalPricePerDayMnt)} / хоног${p.rentalDepositMnt != null ? `\nБарьцаа: ${formatMnt(p.rentalDepositMnt)}` : ""}${p.rentalTerms ? `\n${p.rentalTerms}` : ""}`}
            <p className="mt-3">
              <Link href={`/help?type=other&subject=${encodeURIComponent(`Түрээс: ${p.name}`)}`} className="btn btn-secondary">Түрээсийн хүсэлт илгээх</Link>
            </p>
          </Section>
        )}
        {(p.sanitationInfo || p.safetyInspectionInfo) && (
          <Section id="s-safety" title="Цэвэрлэгээ, ариутгал, аюулгүй байдлын шалгалт" open>
            {[p.sanitationInfo && `Цэвэрлэгээ, ариутгал: ${p.sanitationInfo}`, p.safetyInspectionInfo && `Аюулгүй байдлын шалгалт: ${p.safetyInspectionInfo}`].filter(Boolean).join("\n\n")}
          </Section>
        )}
        {p.sourceNote && <Section id="s-source" title="Мэдээллийн эх сурвалж" open={openAll}>{p.sourceNote}</Section>}
      </div>

      <section aria-labelledby="reviews-title" className="mt-12">
        <h2 id="reviews-title" className="text-2xl font-bold">Худалдан авагчийн үнэлгээ</h2>
        {p.reviews.length ? (
          <ul className="mt-4 space-y-3" role="list">
            {p.reviews.map((r) => (
              <li key={r.id} className="card p-4">
                <p className="font-semibold">Үнэлгээ: {r.rating} / 5</p>
                <p className="mt-1 whitespace-pre-line">{r.body}</p>
                <p className="mt-2 text-sm text-muted">{r.author} · {formatDate(r.createdAt)} · Баталгаажсан худалдан авалт</p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-muted">Одоогоор үнэлгээ алга.</p>
        )}
        {canReview && <ReviewForm productId={p.id} already={alreadyReviewed} />}
        {!canReview && <p className="mt-3 text-sm text-muted">Үнэлгээг зөвхөн энэ бүтээгдэхүүнийг хүлээн авсан худалдан авагч бичнэ.</p>}
      </section>

      {p.related.length > 0 && (
        <section aria-labelledby="related-title" className="mt-12">
          <h2 id="related-title" className="mb-4 text-2xl font-bold">Холбоотой бүтээгдэхүүн</h2>
          <ProductGrid items={p.related} />
        </section>
      )}
    </div>
  );
}
