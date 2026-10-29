import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { siteSettings } from "@/db/schema";

/** Админаас тохируулах key-value. Утга тохируулаагүй бол null — UI үүнийг ил тод харуулна. */
export type SettingsMap = {
  bank_transfer_info: { bankName: string; accountName: string; accountNumber: string; note: string };
  store_contact: { phone: string; email: string; address: string; hours: string };
  home_announcement: { text: string };
  assistant_config: { enabled: boolean; extraInstructions: string };
};

export async function getSetting<K extends keyof SettingsMap>(key: K): Promise<SettingsMap[K] | null> {
  const row = (await db.select().from(siteSettings).where(eq(siteSettings.key, key)).limit(1))[0];
  return (row?.value as SettingsMap[K]) ?? null;
}

export async function setSetting<K extends keyof SettingsMap>(key: K, value: SettingsMap[K]) {
  await db
    .insert(siteSettings)
    .values({ key, value })
    .onConflictDoUpdate({ target: siteSettings.key, set: { value, updatedAt: new Date() } });
}
