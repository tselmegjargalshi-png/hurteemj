import Link from "next/link";
import type { ProductCardData } from "@/lib/products";
import { Price, StockStatus } from "./price";

/** Карт бүхэлдээ нэг холбоос биш — гарчиг нь холбоос (дэлгэц уншигч бүх текстийг холбоосын нэр болгон уншихаас сэргийлнэ). */
export function ProductCard({ p, headingLevel = 3 }: { p: ProductCardData; headingLevel?: 2 | 3 }) {
  const H = `h${headingLevel}` as "h2" | "h3";
  return (
    <article className="card flex h-full flex-col overflow-hidden">
      <div className="aspect-[4/3] bg-surface-2">
        {p.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={p.image.url} alt={p.image.alt} loading="lazy" className="h-full w-full object-contain" />
        ) : (
          <div className="flex h-full items-center justify-center p-4 text-center text-muted">Зураг оруулаагүй</div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <p className="text-sm text-muted">{p.categoryName}</p>
        <H className="text-lg font-bold leading-snug">
          <Link href={`/products/${p.slug}`} className="text-fg underline-offset-4 hover:underline">
            {p.name}
          </Link>
        </H>
        {p.condition === "used_inspected" && <span className="badge w-fit">Шалгагдсан хуучин</span>}
        {p.image?.isAiGenerated && <span className="badge w-fit">Зураг AI-аар бүтээсэн, бодит зураг биш</span>}
        {p.summary && <p className="line-clamp-3 text-muted">{p.summary}</p>}
        <div className="mt-auto space-y-1 pt-2">
          <Price value={p.priceMnt} verified={p.priceVerified} />
          <p className="text-sm">
            <StockStatus stock={p.stock} />
          </p>
        </div>
      </div>
    </article>
  );
}

export function ProductGrid({ items, headingLevel = 3 }: { items: ProductCardData[]; headingLevel?: 2 | 3 }) {
  return (
    <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4" role="list">
      {items.map((p) => (
        <li key={p.id}>
          <ProductCard p={p} headingLevel={headingLevel} />
        </li>
      ))}
    </ul>
  );
}
