"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { getCart } from "@/lib/cart";
import { errorState, zodErrorState, type ActionState } from "@/lib/forms";
import { CheckoutError, createOrder } from "@/lib/orders";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { email, opt, phone, req } from "@/lib/validation";

const schema = z.object({
  contactName: req("Нэр", 100),
  contactPhone: phone,
  contactEmail: z.union([z.literal(""), email]).transform((v) => v || undefined),
  contactPreference: z.enum(["in_app", "sms", "email", "phone_call", "video_call"], { errorMap: () => ({ message: "Холбогдох хэлбэрээ сонгоно уу." }) }),
  deliveryMethodId: z.coerce.number({ invalid_type_error: "Хүргэлтийн төрлөө сонгоно уу." }).int(),
  city: opt(100),
  district: opt(100),
  khoroo: opt(50),
  addressLine: opt(300),
  addressNote: opt(500),
  paymentMethod: z.enum(["cash_on_delivery", "bank_transfer"], { errorMap: () => ({ message: "Төлбөрийн хэлбэрээ сонгоно уу." }) }),
  customerNote: opt(1000),
  confirm: z.literal("on", { errorMap: () => ({ message: "Захиалгаа баталгаажуулахын тулд зөвшөөрнө үү." }) }),
});

export async function placeOrder(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/checkout");
  const parsed = schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return zodErrorState(parsed.error, fd);
  if (!(await rateLimit(`order:${user.id}`, 10, 60 * 60)) || !(await rateLimit(`order-ip:${await clientIp()}`, 30, 60 * 60))) {
    return errorState("Хэт олон захиалга илгээлээ. Түр хүлээгээд дахин оролдоно уу.", fd);
  }
  const cart = await getCart();
  if (!cart.id || !cart.lines.length) return errorState("Сагс хоосон байна.", fd);
  const { confirm: _c, ...d } = parsed.data;
  let orderId: string;
  try {
    const order = await createOrder({ userId: user.id, cartId: cart.id, ...d });
    orderId = order.id;
  } catch (e) {
    if (e instanceof CheckoutError) {
      const fe = e.message.includes("Хаяг") ? { addressLine: e.message } : undefined;
      return errorState(e.message, fd, fe);
    }
    console.error("checkout failed", e);
    return errorState("Захиалга бүртгэхэд алдаа гарлаа. Дахин оролдоно уу. Асуудал давтагдвал тусламж хүсээрэй.", fd);
  }
  redirect(`/orders/${orderId}?placed=1`);
}
