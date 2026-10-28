"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import { products, wishlistItems } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { errorState, successState, type ActionState } from "@/lib/forms";

export async function toggleWishlist(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) return errorState("Хадгалах жагсаалт ашиглахын тулд нэвтэрнэ үү.");
  const id = z.string().uuid().safeParse(fd.get("productId"));
  if (!id.success) return errorState("Бүтээгдэхүүн олдсонгүй.");
  const product = (await db.select({ name: products.name, slug: products.slug }).from(products).where(eq(products.id, id.data)).limit(1))[0];
  if (!product) return errorState("Бүтээгдэхүүн олдсонгүй.");
  const where = and(eq(wishlistItems.userId, user.id), eq(wishlistItems.productId, id.data));
  const exists = (await db.select().from(wishlistItems).where(where).limit(1))[0];
  if (exists) await db.delete(wishlistItems).where(where);
  else await db.insert(wishlistItems).values({ userId: user.id, productId: id.data });
  revalidatePath(`/products/${product.slug}`);
  revalidatePath("/account/wishlist");
  return successState(exists ? `«${product.name}» хадгалах жагсаалтаас хасагдлаа.` : `«${product.name}» хадгалах жагсаалтад нэмэгдлээ.`);
}
