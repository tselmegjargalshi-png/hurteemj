import type { Metadata } from "next";
import Link from "next/link";
import { ProductGrid } from "@/components/product-card";
import { VoiceSearch } from "@/components/voice-search";
import { categoriesWithCounts, listProducts, SORTS } from "@/lib/products";
import { parseProductQuery, toSearch } from "@/lib/search-params";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const q = parseProductQuery(await searchParams);
  return { title: q.q ? `"${q.q}" хайлтын үр дүн` : "Дэлгүүр" };
}

export default async function ProductsPage({ searchParams }: Props) {
  const query = parseProductQuery(await searchParams);
  const [cats, result] = await Promise.all([categoriesWithCounts(), listProducts(query)]);
  const category = cats.find((c) => c.slug === query.category);
  const totalPages = Math.max(1, Math.ceil(result.total / result.pageSize));
  const heading = query.q ? `"${query.q}" хайлтын үр дүн` : category ? category.name : "Бүх бүтээгдэхүүн";

  return (
    <div>
      <nav aria-label="Байршил" className="mb-4 text-sm">
        <ol className="flex flex-wrap gap-2">
          <li><Link href="/" className="underline">Нүүр</Link> <span aria-hidden="true">/</span></li>
          <li><Link href="/products" className="underline">Дэлгүүр</Link>{category && <span aria-hidden="true"> /</span>}</li>
          {category && <li aria-current="page">{category.name}</li>}
        </ol>
      </nav>
      <h1 className="text-3xl font-bold">{heading}</h1>
      <p className="mt-2 text-lg" id="result-count">
        {result.total} бүтээгдэхүүн олдлоо{totalPages > 1 ? ` (хуудас ${result.page} / ${totalPages})` : ""}.
      </p>
      {category?.description && <p className="mt-1 text-muted">{category.description}</p>}

      <div className="mt-6 grid gap-8 lg:grid-cols-[18rem_1fr]">
        <aside aria-labelledby="filter-title">
          <h2 id="filter-title" className="mb-3 text-xl font-bold">
            Хайх, шүүх
          </h2>
          <form method="get" action="/products" role="search" aria-label="Бүтээгдэхүүн хайх, шүүх" className="card space-y-4 p-4">
            <div>
              <label htmlFor="q" className="field-label">Хайх үг</label>
              <input id="q" name="q" type="search" defaultValue={query.q} className="field-input" autoComplete="off" />
              <div className="mt-2 flex flex-wrap gap-2">
                <VoiceSearch inputId="q" />
              </div>
            </div>
            <div>
              <label htmlFor="category" className="field-label">Ангилал</label>
              <select id="category" name="category" defaultValue={query.category ?? ""} className="field-input">
                <option value="">Бүх ангилал</option>
                {cats.map((c) => (
                  <option key={c.slug} value={c.slug}>
                    {c.name} ({c.productCount})
                  </option>
                ))}
              </select>
            </div>
            <fieldset>
              <legend className="field-label">Үнэ (төгрөг)</legend>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label htmlFor="min" className="text-sm">Доод</label>
                  <input id="min" name="min" type="number" inputMode="numeric" min={0} defaultValue={query.minPrice} className="field-input" />
                </div>
                <div>
                  <label htmlFor="max" className="text-sm">Дээд</label>
                  <input id="max" name="max" type="number" inputMode="numeric" min={0} defaultValue={query.maxPrice} className="field-input" />
                </div>
              </div>
            </fieldset>
            <div>
              <label htmlFor="condition" className="field-label">Төлөв</label>
              <select id="condition" name="condition" defaultValue={query.condition ?? ""} className="field-input">
                <option value="">Бүгд</option>
                <option value="new">Шинэ</option>
                <option value="used_inspected">Шалгагдсан хуучин</option>
              </select>
            </div>
            <label className="check-row" htmlFor="instock">
              <input id="instock" name="instock" type="checkbox" value="1" defaultChecked={query.inStock} />
              <span>Зөвхөн нөөцөд байгаа</span>
            </label>
            <div>
              <label htmlFor="sort" className="field-label">Эрэмбэлэх</label>
              <select id="sort" name="sort" defaultValue={query.sort ?? ""} className="field-input">
                <option value="">Анхдагч</option>
                {Object.entries(SORTS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="submit" className="btn btn-primary">Шүүлтүүр хэрэглэх</button>
              <Link href="/products" className="btn btn-secondary">Цэвэрлэх</Link>
            </div>
          </form>
        </aside>

        <section aria-labelledby="results-title">
          <h2 id="results-title" className="sr-only">Хайлтын үр дүн</h2>
          {result.items.length ? (
            <ProductGrid items={result.items} />
          ) : (
            <div className="notice notice-info">
              <p className="font-semibold">Таны хайлтад тохирох бүтээгдэхүүн олдсонгүй.</p>
              <p className="mt-1">Өөр үгээр хайх, шүүлтүүрээ цэвэрлэх эсвэл <Link href="/help" className="underline">бичгээр тусламж хүсэх</Link> боломжтой.</p>
            </div>
          )}
          {totalPages > 1 && (
            <nav aria-label="Хуудаслалт" className="mt-8 flex flex-wrap items-center gap-3">
              {result.page > 1 && (
                <Link href={`/products${toSearch(query, { page: result.page - 1 })}`} className="btn btn-secondary">
                  Өмнөх хуудас
                </Link>
              )}
              <span>Хуудас {result.page} / {totalPages}</span>
              {result.page < totalPages && (
                <Link href={`/products${toSearch(query, { page: result.page + 1 })}`} className="btn btn-secondary">
                  Дараах хуудас
                </Link>
              )}
            </nav>
          )}
        </section>
      </div>
    </div>
  );
}
