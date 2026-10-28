import "server-only";
import { and, asc, eq, inArray, sql } from "drizzle-orm";
import { cookies } from "next/headers";
import { cache } from "react";
import { db } from "@/db";
import { cartItems, carts, productImages, products } from "@/db/schema";
import { getCurrentUser } from "./auth";

export const CART_COOKIE = "cart";
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const MAX_QTY = 20;

async function guestCartId(): Promise<string | null> {
  const v = (await cookies()).get(CART_COOKIE)?.value;
  return v && UUID_RE.test(v) ? v : null;
}

/** Одоогийн сагсны id (нэвтэрсэн бол хэрэглэгчийн, үгүй бол cookie-д). create=true бол байхгүй үед үүсгэнэ. */
export async function getCartId(create: boolean): Promise<string | null> {
  const user = await getCurrentUser();
  if (user) {
    const existing = await db.select({ id: carts.id }).from(carts).where(eq(carts.userId, user.id)).limit(1);
    if (existing[0]) return existing[0].id;
    if (!create) return null;
    const [c] = await db.insert(carts).values({ userId: user.id }).onConflictDoNothing().returning({ id: carts.id });
    if (c) return c.id;
    return (await db.select({ id: carts.id }).from(carts).where(eq(carts.userId, user.id)).limit(1))[0]?.id ?? null;
  }
  const id = await guestCartId();
  if (id) {
    // Зочны сагс зөвхөн хэрэглэгчгүй сагс байх ёстой (бусдын сагсыг cookie-гоор авахаас сэргийлнэ).
    const found = await db.select({ id: carts.id, userId: carts.userId }).from(carts).where(eq(carts.id, id)).limit(1);
    if (found[0] && !found[0].userId) return id;
  }
  if (!create) return null;
  const [c] = await db.insert(carts).values({}).returning({ id: carts.id });
  (await cookies()).set(CART_COOKIE, c.id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 60,
  });
  return c.id;
}

/** Нэвтэрсний дараа зочны сагсыг хэрэглэгчийн сагстай нэгтгэнэ. */
export async function mergeGuestCart(userId: string) {
  const guestId = await guestCartId();
  if (!guestId) return;
  await db.transaction(async (tx) => {
    const guest = (await tx.select().from(carts).where(eq(carts.id, guestId)).limit(1))[0];
    if (!guest || guest.userId) return;
    let userCart = (await tx.select().from(carts).where(eq(carts.userId, userId)).limit(1))[0];
    if (!userCart) {
      await tx.update(carts).set({ userId }).where(eq(carts.id, guestId));
      return;
    }
    const items = await tx.select().from(cartItems).where(eq(cartItems.cartId, guestId));
    for (const it of items) {
      await tx
        .insert(cartItems)
        .values({ cartId: userCart.id, productId: it.productId, quantity: it.quantity })
        .onConflictDoUpdate({
          target: [cartItems.cartId, cartItems.productId],
          set: { quantity: sql`least(${cartItems.quantity} + ${it.quantity}, ${MAX_QTY})` },
        });
    }
    await tx.delete(carts).where(eq(carts.id, guestId));
  });
  (await cookies()).delete(CART_COOKIE);
}

export type CartLine = {
  productId: string;
  slug: string;
  name: string;
  priceMnt: number;
  priceVerified: boolean;
  stock: number;
  quantity: number;
  status: string;
  image: { url: string; alt: string } | null;
};

export const getCart = cache(async (): Promise<{ id: string | null; lines: CartLine[]; subtotal: number; count: number }> => {
  const id = await getCartId(false);
  if (!id) return { id: null, lines: [], subtotal: 0, count: 0 };
  const rows = await db
    .select({
      productId: products.id,
      slug: products.slug,
      name: products.name,
      priceMnt: products.priceMnt,
      priceVerified: products.priceVerified,
      stock: products.stock,
      status: products.status,
      quantity: cartItems.quantity,
    })
    .from(cartItems)
    .innerJoin(products, eq(products.id, cartItems.productId))
    .where(eq(cartItems.cartId, id))
    .orderBy(asc(cartItems.addedAt));
  const imgs = rows.length
    ? await db
        .select({ productId: productImages.productId, url: productImages.url, alt: productImages.alt, sortOrder: productImages.sortOrder })
        .from(productImages)
        .where(inArray(productImages.productId, rows.map((r) => r.productId)))
        .orderBy(asc(productImages.sortOrder))
    : [];
  const lines = rows.map((r) => {
    const img = imgs.find((i) => i.productId === r.productId);
    return { ...r, image: img ? { url: img.url, alt: img.alt } : null };
  });
  const subtotal = lines.reduce((s, l) => s + l.priceMnt * l.quantity, 0);
  const count = lines.reduce((s, l) => s + l.quantity, 0);
  return { id, lines, subtotal, count };
});

export async function setCartQuantity(cartId: string, productId: string, quantity: number) {
  if (quantity <= 0) {
    await db.delete(cartItems).where(and(eq(cartItems.cartId, cartId), eq(cartItems.productId, productId)));
    return;
  }
  await db
    .insert(cartItems)
    .values({ cartId, productId, quantity })
    .onConflictDoUpdate({ target: [cartItems.cartId, cartItems.productId], set: { quantity } });
}
