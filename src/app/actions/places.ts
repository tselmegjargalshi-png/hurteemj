"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/db";
import { accessibilityFeatures, accessiblePlaces, placeEditSuggestions } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { errorState, successState, zodErrorState, type ActionState } from "@/lib/forms";
import { PLACE_FEATURE_LABELS, PLACE_TYPE_LABELS } from "@/lib/labels";
import { rateLimit } from "@/lib/rate-limit";
import { opt, req } from "@/lib/validation";

const featureKeys = Object.keys(PLACE_FEATURE_LABELS) as (keyof typeof PLACE_FEATURE_LABELS)[];

/** Хэрэглэгч шинэ газар санал болгоно. Админ шалгаж нийтлэх хүртэл харагдахгүй, "баталгаажсан" гэж тэмдэглэгдэхгүй. */
export async function suggestPlace(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) return errorState("Газар нэмэхийн тулд нэвтэрнэ үү.");
  const schema = z.object({
    name: req("Газрын нэр", 200),
    type: z.enum(Object.keys(PLACE_TYPE_LABELS) as [keyof typeof PLACE_TYPE_LABELS], { errorMap: () => ({ message: "Төрлөө сонгоно уу." }) }),
    address: req("Хаяг", 300),
    district: opt(100),
    description: opt(1500),
    source: opt(300),
  });
  const p = schema.safeParse(Object.fromEntries(fd));
  if (!p.success) return zodErrorState(p.error, fd);
  if (!(await rateLimit(`place:${user.id}`, 10, 60 * 60 * 24))) return errorState("Өдөрт илгээх хязгаарт хүрлээ.", fd);
  const [place] = await db
    .insert(accessiblePlaces)
    .values({ ...p.data, district: p.data.district ?? null, description: p.data.description ?? "", source: p.data.source ?? `Хэрэглэгчийн санал (${user.name})`, verificationStatus: "community_reported", submittedBy: user.id, isPublished: false })
    .returning({ id: accessiblePlaces.id });
  for (const k of featureKeys) {
    const v = z.enum(["yes", "partial", "no", "unknown"]).safeParse(fd.get(`feature_${k}`));
    await db.insert(accessibilityFeatures).values({ placeId: place.id, feature: k, value: v.success ? v.data : "unknown" });
  }
  redirect("/places?submitted=1");
}

export async function suggestPlaceEdit(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) return errorState("Засвар санал болгохын тулд нэвтэрнэ үү.");
  const p = z.object({ placeId: z.string().uuid(), body: z.string().trim().min(10, "Дор хаяж 10 тэмдэгтээр тайлбарлана уу.").max(2000, "Хэт урт байна.") }).safeParse(Object.fromEntries(fd));
  if (!p.success) return zodErrorState(p.error, fd);
  if (!(await rateLimit(`placeedit:${user.id}`, 20, 60 * 60 * 24))) return errorState("Өдөрт илгээх хязгаарт хүрлээ.", fd);
  await db.insert(placeEditSuggestions).values({ placeId: p.data.placeId, userId: user.id, body: p.data.body });
  return successState("Таны санал администраторт илгээгдлээ. Шалгасны дараа мэдээлэл шинэчлэгдэнэ.");
}
