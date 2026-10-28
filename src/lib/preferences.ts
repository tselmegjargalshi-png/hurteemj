import "server-only";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { z } from "zod";
import { db } from "@/db";
import { userPreferences } from "@/db/schema";
import { getCurrentUser } from "./auth";

export const PREFS_COOKIE = "a11y";

export const prefsSchema = z.object({
  fontSize: z.enum(["normal", "large", "xlarge"]).default("normal"),
  highContrast: z.boolean().default(false),
  reduceMotion: z.boolean().default(false),
  largeTargets: z.boolean().default(false),
  strongFocus: z.boolean().default(false),
  underlineLinks: z.boolean().default(false),
  simpleLanguage: z.boolean().default(false),
  screenReaderMode: z.boolean().default(false),
  voiceInput: z.boolean().default(false),
  contentFormat: z.enum(["text", "text_simple", "text_with_video"]).default("text"),
});
export type Prefs = z.infer<typeof prefsSchema>;
export const DEFAULT_PREFS: Prefs = prefsSchema.parse({});

function fromCookie(raw: string | undefined): Prefs | null {
  if (!raw) return null;
  try {
    const parsed = prefsSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

/** Нэвтэрсэн бол DB-с, үгүй бол cookie-с. Ингэснээр нэвтрэх бүрт дахин тохируулах шаардлагагүй. */
export async function getPreferences(): Promise<{ prefs: Prefs; isSet: boolean }> {
  const user = await getCurrentUser();
  if (user) {
    const row = (await db.select().from(userPreferences).where(eq(userPreferences.userId, user.id)).limit(1))[0];
    if (row) return { prefs: prefsSchema.parse(row), isSet: row.onboardingDone };
  }
  const c = fromCookie((await cookies()).get(PREFS_COOKIE)?.value);
  return { prefs: c ?? DEFAULT_PREFS, isSet: c !== null };
}

export async function writePrefsCookie(prefs: Prefs) {
  (await cookies()).set(PREFS_COOKIE, JSON.stringify(prefs), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
}

export async function savePreferencesForUser(userId: string, prefs: Prefs) {
  await db
    .insert(userPreferences)
    .values({ userId, ...prefs, onboardingDone: true })
    .onConflictDoUpdate({ target: userPreferences.userId, set: { ...prefs, onboardingDone: true, updatedAt: new Date() } });
}

/** <html> элементэд тавих data-* шинжүүд. CSS эдгээрийг ашиглан харагдах байдлыг өөрчилнө. */
export function prefsToHtmlAttrs(p: Prefs): Record<string, string> {
  return {
    "data-font": p.fontSize,
    "data-contrast": p.highContrast ? "high" : "normal",
    "data-motion": p.reduceMotion ? "reduce" : "normal",
    "data-targets": p.largeTargets ? "large" : "normal",
    "data-focus": p.strongFocus ? "strong" : "normal",
    "data-links": p.underlineLinks ? "underline" : "normal",
    "data-sr": p.screenReaderMode ? "on" : "off",
  };
}
