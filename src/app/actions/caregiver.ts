"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import { caregiverLinks, users } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { errorState, successState, zodErrorState, type ActionState } from "@/lib/forms";
import { notify } from "@/lib/notify";
import { rateLimit } from "@/lib/rate-limit";
import { checkbox, email } from "@/lib/validation";

const perms = { canViewOrders: checkbox, canViewBookings: checkbox, canViewSupport: checkbox };

/** Хэрэглэгч өөрөө асран хамгаалагчийг урина. Асран хамгаалагч хүлээн авах хүртэл, мөн хэрэглэгчийн зөвшөөрсөн мэдээллийг л харна. */
export async function inviteCaregiver(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) return errorState("Нэвтэрнэ үү.");
  const p = z.object({ email, ...perms }).safeParse(Object.fromEntries(fd));
  if (!p.success) return zodErrorState(p.error, fd);
  if (!(await rateLimit(`invite:${user.id}`, 10, 60 * 60 * 24))) return errorState("Өдөрт илгээх хязгаарт хүрлээ.", fd);
  const target = (await db.select({ id: users.id, name: users.name }).from(users).where(eq(users.email, p.data.email)).limit(1))[0];
  // Бүртгэлтэй эсэхийг задруулахгүйн тулд ижил мессеж өгнө.
  const generic = successState("Хэрэв энэ имэйлтэй бүртгэл байвал урилга илгээгдлээ. Тэр хүн нэвтэрч хүлээн авах хэрэгтэй.");
  if (!target || target.id === user.id) return generic;
  await db
    .insert(caregiverLinks)
    .values({ userId: user.id, caregiverId: target.id, canViewOrders: p.data.canViewOrders, canViewBookings: p.data.canViewBookings, canViewSupport: p.data.canViewSupport, status: "pending" })
    .onConflictDoUpdate({ target: [caregiverLinks.userId, caregiverLinks.caregiverId], set: { canViewOrders: p.data.canViewOrders, canViewBookings: p.data.canViewBookings, canViewSupport: p.data.canViewSupport, status: "pending", updatedAt: new Date() } });
  await notify(target.id, "Асран хамгаалагчаар урилга", `${user.name} таныг асран хамгаалагчаар урьж байна. «Асран хамгаалагчийн хэсэг»-ээс хүлээн авах эсвэл татгалзана уу.`, "/caregiver");
  revalidatePath("/account/caregivers");
  return generic;
}

export async function updateCaregiverPermissions(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) return errorState("Нэвтэрнэ үү.");
  const p = z.object({ linkId: z.string().uuid(), ...perms }).safeParse(Object.fromEntries(fd));
  if (!p.success) return errorState("Мэдээлэл буруу байна.");
  const r = await db.update(caregiverLinks).set({ canViewOrders: p.data.canViewOrders, canViewBookings: p.data.canViewBookings, canViewSupport: p.data.canViewSupport, updatedAt: new Date() }).where(and(eq(caregiverLinks.id, p.data.linkId), eq(caregiverLinks.userId, user.id))).returning({ id: caregiverLinks.id });
  if (!r.length) return errorState("Холбоос олдсонгүй.");
  revalidatePath("/account/caregivers");
  return successState("Зөвшөөрөл шинэчлэгдлээ.");
}

export async function revokeCaregiver(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) return errorState("Нэвтэрнэ үү.");
  const id = z.string().uuid().safeParse(fd.get("linkId"));
  if (!id.success) return errorState("Холбоос олдсонгүй.");
  // Хэрэглэгч эсвэл асран хамгаалагч аль ч талаас нь цуцалж болно.
  const r = await db.update(caregiverLinks).set({ status: "revoked", updatedAt: new Date() }).where(and(eq(caregiverLinks.id, id.data), eq(caregiverLinks.userId, user.id))).returning({ id: caregiverLinks.id });
  const r2 = r.length ? r : await db.update(caregiverLinks).set({ status: "revoked", updatedAt: new Date() }).where(and(eq(caregiverLinks.id, id.data), eq(caregiverLinks.caregiverId, user.id))).returning({ id: caregiverLinks.id });
  if (!r2.length) return errorState("Холбоос олдсонгүй.");
  revalidatePath("/account/caregivers");
  revalidatePath("/caregiver");
  return successState("Хандалт цуцлагдлаа.");
}

export async function respondInvite(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) return errorState("Нэвтэрнэ үү.");
  const p = z.object({ linkId: z.string().uuid(), decision: z.enum(["accept", "decline"]) }).safeParse(Object.fromEntries(fd));
  if (!p.success) return errorState("Мэдээлэл буруу байна.");
  const link = (await db.select().from(caregiverLinks).where(and(eq(caregiverLinks.id, p.data.linkId), eq(caregiverLinks.caregiverId, user.id), eq(caregiverLinks.status, "pending"))).limit(1))[0];
  if (!link) return errorState("Урилга олдсонгүй.");
  await db.update(caregiverLinks).set({ status: p.data.decision === "accept" ? "active" : "revoked", updatedAt: new Date() }).where(eq(caregiverLinks.id, link.id));
  await notify(link.userId, p.data.decision === "accept" ? "Асран хамгаалагч урилгыг хүлээн авлаа" : "Асран хамгаалагч урилгаас татгалзлаа", `${user.name}`, "/account/caregivers");
  revalidatePath("/caregiver");
  return successState(p.data.decision === "accept" ? "Урилгыг хүлээн авлаа." : "Урилгаас татгалзлаа.");
}
