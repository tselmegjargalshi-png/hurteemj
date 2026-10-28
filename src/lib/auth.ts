import "server-only";
import { createHash, randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { and, eq, gt, lt } from "drizzle-orm";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { db } from "@/db";
import { sessions, users } from "@/db/schema";

export const SESSION_COOKIE = "sid";
const SESSION_DAYS = 30;
const BCRYPT_COST = 12;

export type Role = (typeof users.$inferSelect)["role"];
export type CurrentUser = { id: string; email: string; name: string; phone: string | null; role: Role };

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, BCRYPT_COST);
}

// Хэрэглэгч олдоогүй үед ч ижил хугацаа зарцуулж, имэйл бүртгэлтэй эсэхийг цаг хугацаагаар таахаас сэргийлнэ.
const DUMMY_HASH = "$2b$12$ABwNwSKnNtQ/ULn7v8WyoubsvBRRWpd8z9iG9hcKOJfucfmYa.kBK";

export async function verifyPassword(password: string, hash: string | null) {
  const ok = await bcrypt.compare(password, hash ?? DUMMY_HASH);
  return hash ? ok : false;
}

export async function createSession(userId: string) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  await db.insert(sessions).values({ id: hashToken(token), userId, expiresAt });
  // Хуучирсан session-уудыг цэвэрлэнэ.
  await db.delete(sessions).where(and(eq(sessions.userId, userId), lt(sessions.expiresAt, new Date())));
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) await db.delete(sessions).where(eq(sessions.id, hashToken(token)));
  jar.delete(SESSION_COOKIE);
}

/** Нэг request дотор нэг л удаа DB-с уншина. */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token || token.length > 100) return null;
  const rows = await db
    .select({ id: users.id, email: users.email, name: users.name, phone: users.phone, role: users.role, status: users.status })
    .from(sessions)
    .innerJoin(users, eq(users.id, sessions.userId))
    .where(and(eq(sessions.id, hashToken(token)), gt(sessions.expiresAt, new Date())))
    .limit(1);
  const row = rows[0];
  if (!row || row.status !== "active") return null;
  return { id: row.id, email: row.email, name: row.name, phone: row.phone, role: row.role };
});

/** Нэвтрээгүй бол нэвтрэх хуудас руу, нэвтэрсний дараа буцаж ирэх хаягтай. */
export async function requireUser(returnTo: string): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(safeReturnPath(returnTo))}`);
  return user;
}

/** Админы эрхийг СЕРВЕР талд шалгана. Админ хуудас, админ action бүрт заавал дуудна. */
export async function requireAdmin(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/admin");
  if (user.role !== "admin") redirect("/forbidden");
  return user;
}

/** Open redirect-ээс сэргийлж зөвхөн сайтын дотоод замыг зөвшөөрнө. */
export function safeReturnPath(path: string | null | undefined): string {
  if (!path || !path.startsWith("/") || path.startsWith("//") || path.startsWith("/\\")) return "/";
  return path;
}
