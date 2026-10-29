"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import { serviceBookings, serviceListings, serviceProviders } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { errorState, successState, zodErrorState, type ActionState } from "@/lib/forms";
import { notify } from "@/lib/notify";
import { rateLimit } from "@/lib/rate-limit";
import { opt } from "@/lib/validation";

const schema = z.object({
  listingId: z.string().uuid(),
  requestedAt: z
    .string({ required_error: "Хүссэн огноо, цагаа сонгоно уу." })
    .min(1, "Хүссэн огноо, цагаа сонгоно уу.")
    .transform((v) => new Date(v))
    .refine((d) => !Number.isNaN(d.getTime()), "Огноо буруу байна.")
    .refine((d) => d.getTime() > Date.now(), "Ирээдүйн огноо, цаг сонгоно уу."),
  contactPreference: z.enum(["in_app", "sms", "email", "phone_call", "video_call"], { errorMap: () => ({ message: "Холбогдох хэлбэрээ сонгоно уу." }) }),
  note: opt(1000),
});

export async function bookService(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) return errorState("Захиалахын тулд нэвтэрнэ үү.");
  const parsed = schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return zodErrorState(parsed.error, fd);
  if (!(await rateLimit(`booking:${user.id}`, 10, 60 * 60))) return errorState("Хэт олон хүсэлт илгээлээ. Түр хүлээнэ үү.", fd);
  const row = (
    await db
      .select({ l: serviceListings, p: serviceProviders })
      .from(serviceListings)
      .innerJoin(serviceProviders, eq(serviceProviders.id, serviceListings.providerId))
      .where(eq(serviceListings.id, parsed.data.listingId))
      .limit(1)
  )[0];
  if (!row || !row.l.isActive || !row.p.isActive) return errorState("Энэ үйлчилгээ одоогоор идэвхгүй байна.");
  const [b] = await db
    .insert(serviceBookings)
    .values({ listingId: row.l.id, userId: user.id, requestedAt: parsed.data.requestedAt, note: parsed.data.note ?? null, contactPreference: parsed.data.contactPreference })
    .returning({ id: serviceBookings.id });
  await notify(user.id, "Үйлчилгээний хүсэлт илгээгдлээ", `«${row.l.name}» үйлчилгээний хүсэлтийг хүлээн авлаа. Үйлчилгээ үзүүлэгч баталгаажуулах хүртэл «Хүсэлт илгээсэн» төлөвтэй.`, "/services/bookings");
  revalidatePath("/services/bookings");
  return successState(`Хүсэлт илгээгдлээ (${b.id.slice(0, 8)}). Баталгаажуулалтыг «Миний үйлчилгээний захиалга» хэсгээс харна уу. Энэ нь баталгаажсан захиалга биш.`);
}

export async function cancelBooking(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) return errorState("Нэвтэрнэ үү.");
  const id = z.string().uuid().safeParse(fd.get("bookingId"));
  if (!id.success) return errorState("Захиалга олдсонгүй.");
  const res = await db
    .update(serviceBookings)
    .set({ status: "cancelled", updatedAt: new Date() })
    .where(and(eq(serviceBookings.id, id.data), eq(serviceBookings.userId, user.id), eq(serviceBookings.status, "requested")))
    .returning({ id: serviceBookings.id });
  if (!res.length) return errorState("Зөвхөн «Хүсэлт илгээсэн» төлөвтэй захиалгыг цуцалж болно.");
  revalidatePath("/services/bookings");
  return successState("Үйлчилгээний хүсэлт цуцлагдлаа.");
}
