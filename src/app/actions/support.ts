"use server";

import { randomInt } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/db";
import { supportMessages, supportRequests } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { errorState, successState, zodErrorState, type ActionState } from "@/lib/forms";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { req } from "@/lib/validation";

const schema = z
  .object({
    type: z.enum(["product_choice", "order_question", "place_visit", "device_repair", "communication", "website_accessibility", "other"], { errorMap: () => ({ message: "Тусламжийн төрлөө сонгоно уу." }) }),
    subject: req("Гарчиг", 150),
    message: z.string().trim().min(10, "Хүсэлтээ дор хаяж 10 тэмдэгтээр тайлбарлана уу.").max(4000, "Хүсэлт 4000 тэмдэгтээс хэтрэхгүй."),
    contactName: req("Нэр", 100),
    contactPreference: z.enum(["in_app", "sms", "email", "phone_call", "video_call"], { errorMap: () => ({ message: "Холбогдох хэлбэрээ сонгоно уу." }) }),
    contactValue: z.string().trim().max(200).optional(),
    shareConsent: z.literal("on", { errorMap: () => ({ message: "Холбоо барих мэдээллийг ажилтанд харуулахыг зөвшөөрнө үү." }) }),
  })
  .superRefine((d, ctx) => {
    // Нэвтрээгүй хэрэглэгч сайт доторх мэдэгдэл авч чадахгүй тул холбоо барих мэдээлэл заавал.
    if (d.contactPreference !== "in_app" && !d.contactValue) ctx.addIssue({ code: "custom", path: ["contactValue"], message: "Холбоо барих имэйл эсвэл утасны дугаараа оруулна уу." });
  });

export async function createSupportRequest(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const user = await getCurrentUser();
  const parsed = schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return zodErrorState(parsed.error, fd);
  if (!user && parsed.data.contactPreference === "in_app") {
    return errorState("Нэвтрээгүй үед сайт дээрх мэдэгдлээр хариу өгөх боломжгүй. Имэйл эсвэл утасны хэлбэрийг сонгох, эсвэл нэвтэрнэ үү.", fd, { contactPreference: "Нэвтрээгүй үед имэйл эсвэл утас сонгоно уу." });
  }
  if (!(await rateLimit(`support:${user?.id ?? (await clientIp())}`, 10, 60 * 60))) return errorState("Хэт олон хүсэлт илгээлээ. Түр хүлээгээд дахин оролдоно уу.", fd);
  const { shareConsent: _s, ...d } = parsed.data;
  const ref = `TH-${randomInt(100000, 999999)}`;
  const [r] = await db
    .insert(supportRequests)
    .values({ ...d, contactValue: d.contactValue || null, userId: user?.id ?? null, shareConsent: true, referenceNumber: ref })
    .returning({ id: supportRequests.id });
  await db.insert(supportMessages).values({ requestId: r.id, authorId: user?.id ?? null, isStaff: false, body: d.message });
  if (user) redirect(`/help/${r.id}?created=1`);
  redirect(`/help/sent?ref=${ref}`);
}

export async function replySupport(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) return errorState("Нэвтэрнэ үү.");
  const parsed = z.object({ requestId: z.string().uuid(), body: z.string().trim().min(1, "Мессежээ бичнэ үү.").max(4000, "Мессеж хэт урт байна.") }).safeParse(Object.fromEntries(fd));
  if (!parsed.success) return zodErrorState(parsed.error, fd);
  const r = (await db.select().from(supportRequests).where(and(eq(supportRequests.id, parsed.data.requestId), eq(supportRequests.userId, user.id))).limit(1))[0];
  if (!r) return errorState("Хүсэлт олдсонгүй.");
  if (r.status === "closed") return errorState("Энэ хүсэлт хаагдсан байна. Шинэ хүсэлт үүсгэнэ үү.");
  await db.insert(supportMessages).values({ requestId: r.id, authorId: user.id, isStaff: false, body: parsed.data.body });
  await db.update(supportRequests).set({ status: "in_progress", updatedAt: new Date() }).where(eq(supportRequests.id, r.id));
  revalidatePath(`/help/${r.id}`);
  return successState("Мессеж илгээгдлээ.");
}
