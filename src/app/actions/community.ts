"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import { communityPosts, communityReplies, contentReports } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { errorState, successState, zodErrorState, type ActionState } from "@/lib/forms";
import { POST_TYPE_LABELS, REPORT_REASONS } from "@/lib/labels";
import { rateLimit } from "@/lib/rate-limit";
import { opt, req } from "@/lib/validation";

/** Шинэ нийтлэл "pending" төлөвтэй үүсч, администратор хянасны дараа нийтлэгдэнэ (залилан, буруу эмчилгээний зөвлөгөөнөөс сэргийлнэ). */
export async function createPost(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) return errorState("Нийтлэхийн тулд нэвтэрнэ үү.");
  const p = z
    .object({
      type: z.enum(Object.keys(POST_TYPE_LABELS) as [keyof typeof POST_TYPE_LABELS], { errorMap: () => ({ message: "Төрлөө сонгоно уу." }) }),
      title: req("Гарчиг", 200),
      body: z.string().trim().min(10, "Агуулга дор хаяж 10 тэмдэгт байх ёстой.").max(5000, "Агуулга хэт урт байна."),
    })
    .safeParse(Object.fromEntries(fd));
  if (!p.success) return zodErrorState(p.error, fd);
  if (!(await rateLimit(`post:${user.id}`, 10, 60 * 60 * 24))) return errorState("Өдөрт нийтлэх хязгаарт хүрлээ.", fd);
  await db.insert(communityPosts).values({ authorId: user.id, ...p.data, status: user.role === "admin" ? "published" : "pending" });
  redirect("/community?submitted=1");
}

export async function createReply(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) return errorState("Хариулахын тулд нэвтэрнэ үү.");
  const p = z.object({ postId: z.string().uuid(), body: z.string().trim().min(2, "Хариулт хэт богино байна.").max(3000, "Хариулт хэт урт байна.") }).safeParse(Object.fromEntries(fd));
  if (!p.success) return zodErrorState(p.error, fd);
  if (!(await rateLimit(`reply:${user.id}`, 30, 60 * 60))) return errorState("Хэт олон хариулт илгээлээ. Түр хүлээнэ үү.", fd);
  const post = (await db.select({ id: communityPosts.id, status: communityPosts.status }).from(communityPosts).where(eq(communityPosts.id, p.data.postId)).limit(1))[0];
  if (!post || post.status !== "published") return errorState("Нийтлэл олдсонгүй.");
  await db.insert(communityReplies).values({ postId: post.id, authorId: user.id, body: p.data.body });
  revalidatePath(`/community/${post.id}`);
  return successState("Хариулт нэмэгдлээ. Зохисгүй агуулга байвал «Мэдээлэх» товчоор мэдэгдэнэ үү.");
}

export async function reportContent(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const user = await getCurrentUser();
  const p = z
    .object({
      targetType: z.enum(["post", "reply", "place", "job", "product"]),
      targetId: z.string().uuid(),
      reason: z.enum(Object.keys(REPORT_REASONS) as [keyof typeof REPORT_REASONS], { errorMap: () => ({ message: "Шалтгаанаа сонгоно уу." }) }),
      details: opt(1000),
    })
    .safeParse(Object.fromEntries(fd));
  if (!p.success) return zodErrorState(p.error, fd);
  if (!(await rateLimit(`report:${user?.id ?? "anon"}`, 20, 60 * 60))) return errorState("Хэт олон мэдээлэл илгээлээ.", fd);
  await db.insert(contentReports).values({ reporterId: user?.id ?? null, targetType: p.data.targetType, targetId: p.data.targetId, reason: REPORT_REASONS[p.data.reason], details: p.data.details ?? null });
  return successState("Мэдээлэл илгээгдлээ. Администратор шалгана. Баярлалаа.");
}
