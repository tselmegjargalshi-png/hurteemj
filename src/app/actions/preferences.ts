"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { errorState, successState, type ActionState } from "@/lib/forms";
import { DEFAULT_PREFS, prefsSchema, savePreferencesForUser, writePrefsCookie } from "@/lib/preferences";

const on = (fd: FormData, k: string) => fd.get(k) === "on";

export async function savePreferences(_prev: ActionState, fd: FormData): Promise<ActionState> {
  if (fd.get("reset") === "1") {
    await persist(DEFAULT_PREFS);
    return successState("Тохиргоог анхны байдалд нь буцаалаа.");
  }
  const parsed = prefsSchema.safeParse({
    fontSize: fd.get("fontSize") ?? "normal",
    highContrast: on(fd, "highContrast"),
    reduceMotion: on(fd, "reduceMotion"),
    largeTargets: on(fd, "largeTargets"),
    strongFocus: on(fd, "strongFocus"),
    underlineLinks: on(fd, "underlineLinks"),
    simpleLanguage: on(fd, "simpleLanguage"),
    screenReaderMode: on(fd, "screenReaderMode"),
    voiceInput: on(fd, "voiceInput"),
    contentFormat: fd.get("contentFormat") ?? "text",
  } satisfies Record<keyof z.infer<typeof prefsSchema>, unknown>);
  if (!parsed.success) return errorState("Тохиргоог хадгалж чадсангүй. Сонголтоо шалгаад дахин оролдоно уу.");
  await persist(parsed.data);
  const user = await getCurrentUser();
  return successState(
    user
      ? "Тохиргоо хадгалагдлаа. Дараа нэвтрэхэд автоматаар хэрэгжинэ."
      : "Тохиргоо энэ хөтөч дээр хадгалагдлаа. Нэвтэрвэл бүх төхөөрөмж дээр хадгалагдана.",
  );
}

async function persist(prefs: z.infer<typeof prefsSchema>) {
  const user = await getCurrentUser();
  if (user) await savePreferencesForUser(user.id, prefs);
  await writePrefsCookie(prefs);
  revalidatePath("/", "layout");
}
