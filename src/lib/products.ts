import "server-only";
import { and, asc, avg, count, desc, eq, gt, gte, ilike, inArray, lte, ne, or, sql, type SQL } from "drizzle-orm";
import { db } from "@/db";
import { categories, productImages, products, reviews, users } from "@/db/schema";

export const SORTS = {
  relevance: "Хамааралтай",
  newest: "Шинэ нь эхэндээ",
  price_asc: "Үнэ: багаас их рүү",
  price_desc: "Үнэ: ихээс бага руу",
  name: "Нэрээр (А–Я)",
} as const;
export type SortKey = keyof typeof SORTS;

export const PAGE_SIZE = 12;

export type ProductQuery = {
  q?: string;
  category?: string;
  sort?: SortKey;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  condition?: "new" | "used_inspected";
  page?: number;
};

function escapeLike(s: string) {
  return s.replace(/[\\%_]/g, (m) => `\\${m}`);
}

export async function listProducts(query: ProductQuery) {
  const where: SQL[] = [eq(products.status, "published")];
  const q = query.q?.trim().slice(0, 100);
  if (q) {
    const like = `%${escapeLike(q)}%`;
    where.push(
      or(
        ilike(products.name, like),
        ilike(products.summary, like),
        ilike(products.description, like),
        ilike(products.suitableFor, like),
        ilike(categories.name, like),
      )!,
    );
  }
  if (query.category) where.push(eq(categories.slug, query.category));
  if (query.minPrice != null) where.push(gte(products.priceMnt, query.minPrice));
  if (query.maxPrice != null) where.push(lte(products.priceMnt, query.maxPrice));
  if (query.inStock) where.push(gt(products.stock, 0));
  if (query.condition) where.push(eq(products.condition, query.condition));

  const sort = query.sort ?? (q ? "relevance" : "newest");
  const orderBy =
    sort === "price_asc"
      ? [asc(products.priceMnt)]
      : sort === "price_desc"
        ? [desc(products.priceMnt)]
        : sort === "name"
          ? [asc(products.name)]
          : sort === "relevance" && q
            ? [desc(sql`(${products.name} ilike ${`%${escapeLike(q)}%`})`), desc(products.createdAt)]
            : [desc(products.createdAt)];

  const page = Math.max(1, query.page ?? 1);
  const whereSql = and(...where);
  const [rows, totalRow] = await Promise.all([
    db
      .select({
        id: products.id,
        slug: products.slug,
        name: products.name,
        summary: products.summary,
        priceMnt: products.priceMnt,
        priceVerified: products.priceVerified,
        stock: products.stock,
        condition: products.condition,
        categoryName: categories.name,
      })
      .from(products)
      .innerJoin(categories, eq(categories.id, products.categoryId))
      .where(whereSql)
      .orderBy(...orderBy)
      .limit(PAGE_SIZE)
      .offset((page - 1) * PAGE_SIZE),
    db.select({ n: count() }).from(products).innerJoin(categories, eq(categories.id, products.categoryId)).where(whereSql),
  ]);
  return { items: await withImages(rows), total: totalRow[0]?.n ?? 0, page, pageSize: PAGE_SIZE };
}

export async function withImages<T extends { id: string }>(rows: T[]) {
  if (!rows.length) return [] as (T & { image: { url: string; alt: string; isAiGenerated: boolean } | null })[];
  const imgs = await db
    .select()
    .from(productImages)
    .where(inArray(productImages.productId, rows.map((r) => r.id)))
    .orderBy(asc(productImages.sortOrder), asc(productImages.id));
  return rows.map((r) => {
    const i = imgs.find((x) => x.productId === r.id);
    return { ...r, image: i ? { url: i.url, alt: i.alt, isAiGenerated: i.isAiGenerated } : null };
  });
}

export async function latestProducts(limit = 4, featuredOnly = false) {
  const rows = await db
    .select({
      id: products.id,
      slug: products.slug,
      name: products.name,
      summary: products.summary,
      priceMnt: products.priceMnt,
      priceVerified: products.priceVerified,
      stock: products.stock,
      condition: products.condition,
      categoryName: categories.name,
    })
    .from(products)
    .innerJoin(categories, eq(categories.id, products.categoryId))
    .where(and(eq(products.status, "published"), featuredOnly ? eq(products.isFeatured, true) : undefined))
    .orderBy(desc(products.createdAt))
    .limit(limit);
  return withImages(rows);
}

export async function getProductBySlug(slug: string, includeUnpublished = false) {
  const row = (
    await db
      .select({ product: products, category: categories })
      .from(products)
      .innerJoin(categories, eq(categories.id, products.categoryId))
      .where(and(eq(products.slug, slug), includeUnpublished ? undefined : eq(products.status, "published")))
      .limit(1)
  )[0];
  if (!row) return null;
  const [images, reviewRows, stats, related] = await Promise.all([
    db.select().from(productImages).where(eq(productImages.productId, row.product.id)).orderBy(asc(productImages.sortOrder), asc(productImages.id)),
    db
      .select({ id: reviews.id, rating: reviews.rating, body: reviews.body, createdAt: reviews.createdAt, author: users.name })
      .from(reviews)
      .innerJoin(users, eq(users.id, reviews.userId))
      .where(and(eq(reviews.productId, row.product.id), eq(reviews.status, "published")))
      .orderBy(desc(reviews.createdAt))
      .limit(50),
    db
      .select({ avg: avg(reviews.rating), n: count() })
      .from(reviews)
      .where(and(eq(reviews.productId, row.product.id), eq(reviews.status, "published"))),
    db
      .select({
        id: products.id,
        slug: products.slug,
        name: products.name,
        summary: products.summary,
        priceMnt: products.priceMnt,
        priceVerified: products.priceVerified,
        stock: products.stock,
        condition: products.condition,
        categoryName: categories.name,
      })
      .from(products)
      .innerJoin(categories, eq(categories.id, products.categoryId))
      .where(and(eq(products.categoryId, row.product.categoryId), eq(products.status, "published"), ne(products.id, row.product.id)))
      .orderBy(desc(products.createdAt))
      .limit(4),
  ]);
  return {
    ...row.product,
    category: row.category,
    images,
    reviews: reviewRows,
    rating: stats[0]?.n ? { average: Number(stats[0].avg), count: stats[0].n } : null,
    related: await withImages(related),
  };
}

export async function categoriesWithCounts() {
  return db
    .select({
      id: categories.id,
      slug: categories.slug,
      name: categories.name,
      description: categories.description,
      productCount: sql<number>`count(${products.id}) filter (where ${products.status} = 'published')`.mapWith(Number),
    })
    .from(categories)
    .leftJoin(products, eq(products.categoryId, categories.id))
    .groupBy(categories.id)
    .orderBy(asc(categories.sortOrder), asc(categories.name));
}

export type ProductCardData = Awaited<ReturnType<typeof latestProducts>>[number];
