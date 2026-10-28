import { SORTS, type ProductQuery, type SortKey } from "./products";

type SP = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

function int(v: string | undefined, max = 1_000_000_000) {
  if (!v) return undefined;
  const n = Number(v);
  return Number.isInteger(n) && n >= 0 && n <= max ? n : undefined;
}

export function parseProductQuery(sp: SP): ProductQuery {
  const sort = one(sp.sort);
  const condition = one(sp.condition);
  return {
    q: one(sp.q)?.slice(0, 100) || undefined,
    category: one(sp.category)?.replace(/[^a-z0-9-]/g, "") || undefined,
    sort: sort && sort in SORTS ? (sort as SortKey) : undefined,
    minPrice: int(one(sp.min)),
    maxPrice: int(one(sp.max)),
    inStock: one(sp.instock) === "1",
    condition: condition === "new" || condition === "used_inspected" ? condition : undefined,
    page: int(one(sp.page), 10_000),
  };
}

export function toSearch(q: ProductQuery, patch: Partial<ProductQuery> = {}) {
  const m = { ...q, ...patch };
  const p = new URLSearchParams();
  if (m.q) p.set("q", m.q);
  if (m.category) p.set("category", m.category);
  if (m.sort) p.set("sort", m.sort);
  if (m.minPrice != null) p.set("min", String(m.minPrice));
  if (m.maxPrice != null) p.set("max", String(m.maxPrice));
  if (m.inStock) p.set("instock", "1");
  if (m.condition) p.set("condition", m.condition);
  if (m.page && m.page > 1) p.set("page", String(m.page));
  const s = p.toString();
  return s ? `?${s}` : "";
}
