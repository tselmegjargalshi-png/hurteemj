"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import { orderItems, orders, products, reviews } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { errorState, successState, zodErrorState, type ActionState } from "@/lib/forms";

const schema = z.object({
  productId: z.string().uuid(),
  rating: z.coerce.number({ invalid_type_error: "Үнэлгээгээ сонгоно уу." }).int().min(1, "Үнэлгээгээ 1-5 хооронд сонгоно уу.").max(5, "Үнэлгээгээ 1-5 хооронд сонгоно уу."),
  body: z.string().trim().min(10, "Сэтгэгдэл дор хаяж 10 тэмдэгт байх ёстой.").max(2000, "Сэтгэгдэл 2000 тэмдэгтээс хэтрэхгүй."),
});

/** Хүлээн авсан захиалга дотор тухайн бүтээгдэхүүн байгаа эсэхийг шалгана — зохиомол үнэлгээнээс сэргийлнэ. */
export async function findEligibleOrder(userId: string, productId: string) {
  const row = (
    await db
      .select({ orderId: orders.id })
      .from(orders)
      .innerJoin(orderItems, eq(orderItems.orderId, orders.id))
      .where(and(eq(orders.userId, userId), eq(orders.status, "delivered"), eq(orderItems.productId, productId)))
      .limit(1)
  )[0];
  return row?.orderId ?? null;
}

export async function submitReview(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) return errorState("Үнэлгээ бичихийн тулд нэвтэрнэ үү.");
  const parsed = schema.safeParse({ productId: fd.get("productId"), rating: fd.get("rating"), body: fd.get("body") });
  if (!parsed.success) return zodErrorState(parsed.error, fd);
  const orderId = await findEligibleOrder(user.id, parsed.data.productId);
  if (!orderId) return errorState("Зөвхөн энэ бүтээгдэхүүнийг хүлээн авсан худалдан авагч үнэлгээ бичих боломжтой.");
  const inserted = await db
    .insert(reviews)
    .values({ productId: parsed.data.productId, userId: user.id, orderId, rating: parsed.data.rating, body: parsed.data.body })
    .onConflictDoNothing()
    .returning({ id: reviews.id });
  if (!inserted.length) return errorState("Та энэ бүтээгдэхүүнд аль хэдийн үнэлгээ өгсөн байна.");
  const p = (await db.select({ slug: products.slug }).from(products).where(eq(products.id, parsed.data.productId)))[0];
  if (p) revalidatePath(`/products/${p.slug}`);
  return successState("Таны үнэлгээ нийтлэгдлээ. Баярлалаа!");
}
