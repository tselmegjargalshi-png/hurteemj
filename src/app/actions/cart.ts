"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import { cartItems, products } from "@/db/schema";
import { getCart, getCartId, MAX_QTY, setCartQuantity } from "@/lib/cart";
import { errorState, successState, type ActionState } from "@/lib/forms";
import { rateLimit, clientIp } from "@/lib/rate-limit";

const schema = z.object({
  productId: z.string().uuid("Бүтээгдэхүүн олдсонгүй."),
  quantity: z.coerce.number().int("Тоо ширхэг бүхэл тоо байх ёстой.").min(1, "Дор хаяж 1 ширхэг сонгоно уу.").max(MAX_QTY, `Нэг удаад ${MAX_QTY}-с ихгүй ширхэг захиална уу.`),
});

export async function addToCart(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const parsed = schema.safeParse({ productId: fd.get("productId"), quantity: fd.get("quantity") ?? 1 });
  if (!parsed.success) return errorState(parsed.error.issues[0].message, fd, { quantity: parsed.error.issues[0].message });
  if (!(await rateLimit(`cart:${await clientIp()}`, 120, 60))) return errorState("Хэт олон хүсэлт илгээлээ. Түр хүлээгээд дахин оролдоно уу.");

  const product = (await db.select().from(products).where(eq(products.id, parsed.data.productId)).limit(1))[0];
  if (!product || product.status !== "published") return errorState("Энэ бүтээгдэхүүн одоогоор худалдаалагдахгүй байна.");
  if (product.stock <= 0) return errorState(`«${product.name}» дууссан байна.`);

  const cartId = (await getCartId(true))!;
  const existing = (await db.select().from(cartItems).where(and(eq(cartItems.cartId, cartId), eq(cartItems.productId, product.id))).limit(1))[0];
  const desired = (existing?.quantity ?? 0) + parsed.data.quantity;
  const qty = Math.min(desired, product.stock, MAX_QTY);
  await setCartQuantity(cartId, product.id, qty);
  revalidatePath("/", "layout");

  const cart = await getCart();
  const capped = qty < desired ? ` Нөөцөд ${product.stock} ширхэг байгаа тул ${qty} ширхэгээр хязгаарлав.` : "";
  return successState(`«${product.name}» сагсанд нэмэгдлээ. Сагсанд нийт ${cart.count} бараа байна.${capped}`);
}

const updateSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.coerce.number().int().min(0).max(MAX_QTY),
});

export async function updateCartQuantity(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const parsed = updateSchema.safeParse({ productId: fd.get("productId"), quantity: fd.get("quantity") });
  if (!parsed.success) return errorState(`Тоо ширхэг 0-${MAX_QTY} хооронд байх ёстой.`);
  const cartId = await getCartId(false);
  if (!cartId) return errorState("Сагс хоосон байна.");
  const product = (await db.select().from(products).where(eq(products.id, parsed.data.productId)).limit(1))[0];
  if (!product) return errorState("Бүтээгдэхүүн олдсонгүй.");
  const qty = Math.min(parsed.data.quantity, product.stock);
  await setCartQuantity(cartId, product.id, qty);
  revalidatePath("/", "layout");
  if (qty === 0) return successState(`«${product.name}» сагснаас хасагдлаа.`);
  return successState(
    qty < parsed.data.quantity
      ? `Нөөцөд ${product.stock} ширхэг байгаа тул «${product.name}»-ийн тоог ${qty} болгов.`
      : `«${product.name}»-ийн тоо ${qty} боллоо.`,
  );
}

export async function removeFromCart(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const productId = z.string().uuid().safeParse(fd.get("productId"));
  const prevQty = z.coerce.number().int().min(1).max(MAX_QTY).safeParse(fd.get("prevQuantity"));
  if (!productId.success) return errorState("Бүтээгдэхүүн олдсонгүй.");
  const cartId = await getCartId(false);
  if (!cartId) return errorState("Сагс хоосон байна.");
  const product = (await db.select({ name: products.name }).from(products).where(eq(products.id, productId.data)).limit(1))[0];
  await setCartQuantity(cartId, productId.data, 0);
  revalidatePath("/", "layout");
  return {
    ...successState(`«${product?.name ?? "Бүтээгдэхүүн"}» сагснаас хасагдлаа.`),
    // Буцаах боломж: хассан бүтээгдэхүүн, тоо ширхэгийг буцааж өгнө.
    values: { undoProductId: productId.data, undoQuantity: String(prevQty.success ? prevQty.data : 1), undoName: product?.name ?? "" },
  };
}
