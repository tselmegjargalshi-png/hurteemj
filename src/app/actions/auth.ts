"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/db";
import { userPreferences, users } from "@/db/schema";
import { createSession, destroySession, getCurrentUser, hashPassword, safeReturnPath, verifyPassword } from "@/lib/auth";
import { mergeGuestCart } from "@/lib/cart";
import { errorState, zodErrorState, type ActionState } from "@/lib/forms";
import { getPreferences, savePreferencesForUser } from "@/lib/preferences";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { checkbox, email, password, phone, req } from "@/lib/validation";

const registerSchema = z
  .object({
    name: req("Нэр", 100),
    email,
    phone: z.union([z.literal(""), phone]).transform((v) => v || null),
    password,
    passwordConfirm: z.string(),
    terms: checkbox.refine((v) => v, "Үйлчилгээний нөхцөл, хувийн мэдээллийн бодлогыг зөвшөөрнө үү."),
  })
  .refine((d) => d.password === d.passwordConfirm, { path: ["passwordConfirm"], message: "Нууц үг таарахгүй байна. Дахин бичнэ үү." });

export async function register(_prev: ActionState, fd: FormData): Promise<ActionState> {
  if (!(await rateLimit(`register:${await clientIp()}`, 5, 60 * 60))) {
    return errorState("Хэт олон бүртгэл үүсгэх оролдлого хийлээ. 1 цагийн дараа дахин оролдоно уу.", fd);
  }
  const parsed = registerSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return zodErrorState(parsed.error, fd);
  const d = parsed.data;
  const exists = await db.select({ id: users.id }).from(users).where(eq(users.email, d.email)).limit(1);
  if (exists.length) return errorState("Энэ имэйл хаягаар бүртгэл үүссэн байна. Нэвтэрнэ үү.", fd, { email: "Энэ имэйл хаягаар бүртгэл үүссэн байна." });

  const [user] = await db
    .insert(users)
    .values({ name: d.name, email: d.email, phone: d.phone, passwordHash: await hashPassword(d.password) })
    .returning({ id: users.id });
  // Зочин байхдаа сонгосон хүртээмжийн тохиргоог бүртгэлд хадгална.
  const { prefs, isSet } = await getPreferences();
  if (isSet) await savePreferencesForUser(user.id, prefs);
  else await db.insert(userPreferences).values({ userId: user.id }).onConflictDoNothing();
  await createSession(user.id);
  await mergeGuestCart(user.id);
  const next = safeReturnPath(String(fd.get("next") ?? ""));
  redirect(next === "/" ? "/account?welcome=1" : next);
}

const loginSchema = z.object({ email, password: z.string().min(1, "Нууц үгээ оруулна уу.") });

export async function login(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const parsed = loginSchema.safeParse({ email: fd.get("email"), password: fd.get("password") });
  if (!parsed.success) return zodErrorState(parsed.error, fd);
  const ip = await clientIp();
  if (!(await rateLimit(`login:${ip}`, 20, 15 * 60)) || !(await rateLimit(`login:${parsed.data.email}`, 8, 15 * 60))) {
    return errorState("Хэт олон удаа буруу оролдлоо. 15 минутын дараа дахин оролдоно уу.", fd);
  }
  const user = (await db.select().from(users).where(eq(users.email, parsed.data.email)).limit(1))[0];
  const ok = await verifyPassword(parsed.data.password, user?.passwordHash ?? null);
  if (!user || !ok) return errorState("Имэйл эсвэл нууц үг буруу байна.", fd);
  if (user.status !== "active") return errorState("Таны бүртгэл түр хаагдсан байна. Тусламж хэсгээр холбогдоно уу.", fd);
  await createSession(user.id);
  await mergeGuestCart(user.id);
  redirect(safeReturnPath(String(fd.get("next") ?? "")));
}

export async function logout() {
  await destroySession();
  redirect("/");
}

