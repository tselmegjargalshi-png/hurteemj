"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { errorState, successState, type ActionState } from "@/lib/forms";
import { CheckoutError, changeOrderStatus } from "@/lib/orders";

/** Хэрэглэгч зөвхөн өөрийн, баталгаажаагүй (created) захиалгыг цуцалж болно. */
export async function cancelOwnOrder(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) return errorState("Нэвтэрнэ үү.");
  if (fd.get("confirmCancel") !== "on") return errorState("Цуцлахын тулд зөвшөөрлийн нүдийг тэмдэглэнэ үү.");
  const id = z.string().uuid().safeParse(fd.get("orderId"));
  if (!id.success) return errorState("Захиалга олдсонгүй.");
  const o = (await db.select().from(orders).where(and(eq(orders.id, id.data), eq(orders.userId, user.id))).limit(1))[0];
  if (!o) return errorState("Захиалга олдсонгүй.");
  if (o.status !== "created") return errorState("Баталгаажсан захиалгыг сайтаас цуцалж болохгүй. Тусламж хэсгээр хүсэлт илгээнэ үү.");
  try {
    await changeOrderStatus(o.id, "cancelled", user.id, "Худалдан авагч цуцалсан");
  } catch (e) {
    if (e instanceof CheckoutError) return errorState(e.message);
    throw e;
  }
  revalidatePath(`/orders/${o.id}`);
  return successState("Захиалга цуцлагдлаа.");
}
