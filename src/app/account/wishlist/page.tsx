import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { categories, products, wishlistItems } from "@/db/schema";
import { ProductGrid } from "@/components/product-card";
import { requireUser } from "@/lib/auth";
import { withImages } from "@/lib/products";

export const metadata = { title: "Хадгалах жагсаалт" };

export default async function WishlistPage() {
  const user = await requireUser("/account/wishlist");
  const rows = await db
    .select({ id: products.id, slug: products.slug, name: products.name, summary: products.summary, priceMnt: products.priceMnt, priceVerified: products.priceVerified, stock: products.stock, condition: products.condition, categoryName: categories.name })
    .from(wishlistItems)
    .innerJoin(products, eq(products.id, wishlistItems.productId))
    .innerJoin(categories, eq(categories.id, products.categoryId))
    .where(eq(wishlistItems.userId, user.id))
    .orderBy(desc(wishlistItems.createdAt));
  const items = await withImages(rows);
  return (
    <div>
      <h1 className="text-3xl font-bold">Хадгалах жагсаалт</h1>
      <div className="mt-6">{items.length ? <ProductGrid items={items} /> : <p className="notice notice-info">Хадгалсан бараа алга.</p>}</div>
    </div>
  );
}
