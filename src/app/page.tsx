import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { products, reviews, users } from "@/db/schema";
import { ProductGrid } from "@/components/product-card";
import { VoiceSearch } from "@/components/voice-search";
import { formatDate } from "@/lib/format";
import { categoriesWithCounts, latestProducts } from "@/lib/products";
import { getSetting } from "@/lib/settings";

export const dynamic = "force-dynamic";

const MODULES = [
  { href: "/services", title: "Өдөр тутмын туслах үйлчилгээ", text: "Сэргээн засах, засвар, гэрийн туслах, тээвэр, дохионы хэлний орчуулагч." },
  { href: "/places", title: "Хүртээмжтэй газрын мэдээлэл", text: "Налуу зам, лифт, хүртээмжтэй ариун цэврийн өрөөтэй газрууд." },
  { href: "/jobs", title: "Ажил, сургалтын боломж", text: "Хүртээмжтэй ажлын байр, зайнаас ажиллах боломж, сургалт." },
  { href: "/communication", title: "Хүртээмжтэй харилцааны хэрэгсэл", text: "Бичгээр харилцах, видео дуудлага, дохионы хэлний мэдээлэл." },
];

export default async function HomePage() {
  const [cats, newest, featured, latestReviews, announcement] = await Promise.all([
    categoriesWithCounts(),
    latestProducts(4),
    latestProducts(4, true),
    db
      .select({ id: reviews.id, rating: reviews.rating, body: reviews.body, createdAt: reviews.createdAt, author: users.name, productName: products.name, productSlug: products.slug })
      .from(reviews)
      .innerJoin(users, eq(users.id, reviews.userId))
      .innerJoin(products, eq(products.id, reviews.productId))
      .where(eq(reviews.status, "published"))
      .orderBy(desc(reviews.createdAt))
      .limit(3),
    getSetting("home_announcement"),
  ]);

  return (
    <div className="space-y-16">
      {/* Хайлт — хамгийн чухал үйлдэл эхэндээ */}
      <section aria-labelledby="hero-title" className="card px-6 py-10 md:px-12 md:py-14">
        <h1 id="hero-title" className="max-w-3xl text-3xl font-bold leading-tight md:text-5xl">
          Хэрэгцээт туслах хэрэгсэл, үйлчилгээгээ бие даан олоорой
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-muted">
          Дэлгэц уншигч, гар, дуу хоолой болон бусад туслах төхөөрөмжөөр бүрэн ашиглах боломжтойгоор бүтээсэн.
        </p>
        <form action="/products" method="get" role="search" aria-label="Бүтээгдэхүүн хайх" className="mt-8 max-w-2xl">
          <label htmlFor="home-search" className="field-label text-lg">
            Бүтээгдэхүүн хайх
          </label>
          <span id="home-search-hint" className="field-hint">
            Жишээ нь: тэргэнцэр, томруулагч, сонсголын аппарат
          </span>
          <div className="flex flex-wrap gap-3">
            <input id="home-search" name="q" type="search" className="field-input flex-1 basis-64" aria-describedby="home-search-hint" autoComplete="off" />
            <button type="submit" className="btn btn-primary">
              Хайх
            </button>
            <VoiceSearch inputId="home-search" />
          </div>
        </form>
        {announcement?.text && <p className="notice notice-info mt-6">{announcement.text}</p>}
      </section>

      <section aria-labelledby="cats-title">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
          <h2 id="cats-title" className="text-2xl font-bold">
            Бүтээгдэхүүний ангилал
          </h2>
          <Link href="/categories" className="underline">
            Бүх ангиллыг харах
          </Link>
        </div>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3" role="list">
          {cats.map((c) => (
            <li key={c.id}>
              <Link href={`/products?category=${c.slug}`} className="card flex min-h-16 items-center justify-between gap-3 px-5 py-4 font-semibold text-fg no-underline hover:bg-surface-2">
                <span>{c.name}</span>
                <span className="text-sm font-normal text-muted">{c.productCount} бараа</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="featured-title">
        <h2 id="featured-title" className="mb-4 text-2xl font-bold">
          Онцлох бүтээгдэхүүн
        </h2>
        {featured.length ? (
          <ProductGrid items={featured} />
        ) : (
          <p className="notice notice-info">Одоогоор онцлох бүтээгдэхүүн сонгоогүй байна.</p>
        )}
      </section>

      <section aria-labelledby="new-title">
        <h2 id="new-title" className="mb-4 text-2xl font-bold">
          Шинээр нэмэгдсэн бүтээгдэхүүн
        </h2>
        {newest.length ? (
          <ProductGrid items={newest} />
        ) : (
          <p className="notice notice-info">
            Каталогт одоогоор бүтээгдэхүүн нэмэгдээгүй байна. Бид зөвхөн бодит, нийлүүлэгчтэй баталгаажсан бүтээгдэхүүн нэмнэ.
          </p>
        )}
      </section>

      <section aria-labelledby="modules-title">
        <h2 id="modules-title" className="mb-4 text-2xl font-bold">
          Үйлчилгээ ба мэдээлэл
        </h2>
        <ul className="grid gap-4 md:grid-cols-2" role="list">
          {MODULES.map((m) => (
            <li key={m.href} className="card p-5">
              <h3 className="text-lg font-bold">
                <Link href={m.href} className="text-fg underline">
                  {m.title}
                </Link>
              </h3>
              <p className="mt-1 text-muted">{m.text}</p>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="support-title" className="grid gap-4 md:grid-cols-2">
        <div className="card p-6">
          <h2 id="support-title" className="text-xl font-bold">
            Хөнгөлөлт, дэмжлэгийн мэдээлэл
          </h2>
          <p className="mt-2 text-muted">
            Төрийн болон байгууллагын дэмжлэгийн хөтөлбөрийг зөвхөн албан эх сурвалжтай, баталгаажсан үед нийтэлнэ.
          </p>
          <Link href="/support-programs" className="btn btn-secondary mt-4">
            Дэмжлэгийн хөтөлбөрүүд
          </Link>
        </div>
        <div className="card p-6">
          <h2 className="text-xl font-bold">Тусламж хэрэгтэй юу?</h2>
          <p className="mt-2 text-muted">Бүтээгдэхүүн сонгох, захиалга, засвар зэрэг асуудлаар бичгээр тусламж хүсээрэй. Дуудлага шаардлагагүй.</p>
          <Link href="/help" className="btn btn-primary mt-4">
            Тусламж хүсэх
          </Link>
        </div>
      </section>

      <section aria-labelledby="reviews-title">
        <h2 id="reviews-title" className="mb-4 text-2xl font-bold">
          Худалдан авагчийн үнэлгээ
        </h2>
        {latestReviews.length ? (
          <ul className="grid gap-4 md:grid-cols-3" role="list">
            {latestReviews.map((r) => (
              <li key={r.id} className="card p-5">
                <p className="font-semibold">Үнэлгээ: {r.rating} / 5</p>
                <p className="mt-2">{r.body}</p>
                <p className="mt-3 text-sm text-muted">
                  {r.author}, {formatDate(r.createdAt)} —{" "}
                  <Link href={`/products/${r.productSlug}`} className="underline">
                    {r.productName}
                  </Link>
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="notice notice-info">
            Одоогоор үнэлгээ алга. Үнэлгээг зөвхөн бүтээгдэхүүнээ хүлээн авсан худалдан авагч бичнэ.
          </p>
        )}
      </section>

      <section aria-labelledby="info-title">
        <h2 id="info-title" className="mb-4 text-2xl font-bold">
          Хүргэлт, төлбөр, буцаалт
        </h2>
        <ul className="grid gap-3 md:grid-cols-3" role="list">
          <li><Link href="/info/delivery" className="card block p-5 font-semibold text-fg underline">Хүргэлтийн нөхцөл</Link></li>
          <li><Link href="/info/payment" className="card block p-5 font-semibold text-fg underline">Төлбөрийн нөхцөл</Link></li>
          <li><Link href="/info/returns" className="card block p-5 font-semibold text-fg underline">Буцаалт, баталгаа</Link></li>
        </ul>
      </section>
    </div>
  );
}
