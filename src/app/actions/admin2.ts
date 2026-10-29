"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import {
  accessibilityFeatures, accessiblePlaces, communityPosts, communityReplies, contentReports, jobs, placeEditSuggestions,
  serviceBookings, serviceListings, serviceProviders, supportPrograms,
} from "@/db/schema";
import { audit } from "@/lib/audit";
import { requireAdmin } from "@/lib/auth";
import { errorState, successState, zodErrorState, type ActionState } from "@/lib/forms";
import { PLACE_FEATURE_LABELS, PLACE_TYPE_LABELS, SERVICE_CATEGORY_LABELS } from "@/lib/labels";
import { notify } from "@/lib/notify";
import { setSetting } from "@/lib/settings";
import { checkbox, httpsUrl, intMnt, opt, req } from "@/lib/validation";

const id = z.string().uuid().optional().or(z.literal("").transform(() => undefined));
const enumKeys = <T extends object>(o: T) => Object.keys(o) as [keyof T & string, ...(keyof T & string)[]];
const optDate = z.string().optional().transform((v) => (v ? new Date(v) : null));

// ── Үйлчилгээ үзүүлэгч, үйлчилгээ ──────────────────────────────

export async function saveProvider(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  const p = z.object({ id, name: req("Нэр", 200), description: opt(2000), phone: opt(50), email: opt(200), address: opt(300), verified: checkbox, isActive: checkbox }).safeParse(Object.fromEntries(fd));
  if (!p.success) return zodErrorState(p.error, fd);
  const v = { name: p.data.name, description: p.data.description ?? "", phone: p.data.phone ?? null, email: p.data.email ?? null, address: p.data.address ?? null, verified: p.data.verified, verifiedAt: p.data.verified ? new Date() : null, isActive: p.data.isActive };
  if (p.data.id) await db.update(serviceProviders).set(v).where(eq(serviceProviders.id, p.data.id));
  else await db.insert(serviceProviders).values(v);
  await audit({ actorId: admin.id, action: "provider.save", entityType: "service_provider", entityId: p.data.id ?? null, details: { name: v.name, verified: v.verified } });
  revalidatePath("/services");
  return successState("Үйлчилгээ үзүүлэгч хадгалагдлаа.");
}

export async function saveListing(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  const p = z.object({
    id, providerId: z.string().uuid("Үйлчилгээ үзүүлэгчийг сонгоно уу."), category: z.enum(enumKeys(SERVICE_CATEGORY_LABELS), { errorMap: () => ({ message: "Төрөл сонгоно уу." }) }),
    name: req("Нэр", 200), description: opt(3000), priceMnt: z.union([z.literal(""), intMnt("Үнэ")]).transform((x) => (x === "" ? null : x)), priceTerms: opt(300), location: opt(300), schedule: opt(300), isActive: checkbox,
  }).safeParse(Object.fromEntries(fd));
  if (!p.success) return zodErrorState(p.error, fd);
  const v = { providerId: p.data.providerId, category: p.data.category, name: p.data.name, description: p.data.description ?? "", priceMnt: p.data.priceMnt, priceTerms: p.data.priceTerms ?? "", location: p.data.location ?? "", schedule: p.data.schedule ?? "", isActive: p.data.isActive };
  if (p.data.id) await db.update(serviceListings).set(v).where(eq(serviceListings.id, p.data.id));
  else await db.insert(serviceListings).values(v);
  await audit({ actorId: admin.id, action: "listing.save", entityType: "service_listing", entityId: p.data.id ?? null, details: { name: v.name } });
  revalidatePath("/services");
  return successState("Үйлчилгээ хадгалагдлаа.");
}

export async function setBookingStatus(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  const p = z.object({ bookingId: z.string().uuid(), status: z.enum(["requested", "confirmed", "completed", "cancelled", "rejected"]) }).safeParse(Object.fromEntries(fd));
  if (!p.success) return errorState("Төлөв буруу байна.");
  const [b] = await db.update(serviceBookings).set({ status: p.data.status, updatedAt: new Date() }).where(eq(serviceBookings.id, p.data.bookingId)).returning();
  if (!b) return errorState("Захиалга олдсонгүй.");
  const labels = { requested: "Хүсэлт илгээсэн", confirmed: "Баталгаажсан", completed: "Дууссан", cancelled: "Цуцлагдсан", rejected: "Татгалзсан" } as const;
  await notify(b.userId, "Үйлчилгээний захиалгын төлөв өөрчлөгдлөө", `Төлөв: ${labels[p.data.status]}`, "/services/bookings");
  await audit({ actorId: admin.id, action: "booking.status", entityType: "service_booking", entityId: b.id, details: { status: p.data.status } });
  revalidatePath("/admin/bookings");
  return successState("Төлөв шинэчлэгдлээ.");
}

// ── Газар ─────────────────────────────────────────────────────

export async function savePlace(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  const p = z.object({
    id, name: req("Нэр", 200), type: z.enum(enumKeys(PLACE_TYPE_LABELS), { errorMap: () => ({ message: "Төрөл сонгоно уу." }) }), address: req("Хаяг", 300), district: opt(100),
    latitude: z.union([z.literal(""), z.coerce.number().min(-90).max(90)]).transform((x) => (x === "" ? null : x)),
    longitude: z.union([z.literal(""), z.coerce.number().min(-180).max(180)]).transform((x) => (x === "" ? null : x)),
    description: opt(3000), source: opt(300), verificationStatus: z.enum(["unverified", "community_reported", "verified"]), isPublished: checkbox,
  }).safeParse(Object.fromEntries(fd));
  if (!p.success) return zodErrorState(p.error, fd);
  const v = { name: p.data.name, type: p.data.type, address: p.data.address, district: p.data.district ?? null, latitude: p.data.latitude, longitude: p.data.longitude, description: p.data.description ?? "", source: p.data.source ?? "", verificationStatus: p.data.verificationStatus, isPublished: p.data.isPublished, updatedAt: new Date() };
  if (p.data.verificationStatus === "verified" && !v.source) return zodErrorState(new z.ZodError([{ code: "custom", path: ["source"], message: "«Баталгаажсан» гэж тэмдэглэхийн тулд мэдээллийн эх сурвалжийг заавал бичнэ." }]), fd);
  let placeId = p.data.id;
  await db.transaction(async (tx) => {
    const verifiedAt = p.data.verificationStatus === "verified" ? new Date() : null;
    if (placeId) await tx.update(accessiblePlaces).set({ ...v, ...(verifiedAt ? { lastVerifiedAt: verifiedAt } : {}) }).where(eq(accessiblePlaces.id, placeId));
    else placeId = (await tx.insert(accessiblePlaces).values({ ...v, lastVerifiedAt: verifiedAt }).returning({ id: accessiblePlaces.id }))[0].id;
    for (const k of Object.keys(PLACE_FEATURE_LABELS) as (keyof typeof PLACE_FEATURE_LABELS)[]) {
      const val = z.enum(["yes", "partial", "no", "unknown"]).safeParse(fd.get(`feature_${k}`));
      if (!val.success) continue;
      await tx.insert(accessibilityFeatures).values({ placeId: placeId!, feature: k, value: val.data }).onConflictDoUpdate({ target: [accessibilityFeatures.placeId, accessibilityFeatures.feature], set: { value: val.data } });
    }
    await audit({ actorId: admin.id, action: "place.save", entityType: "place", entityId: placeId, details: { name: v.name, verification: v.verificationStatus, published: v.isPublished } }, tx);
  });
  revalidatePath("/places");
  return successState("Газрын мэдээлэл хадгалагдлаа.");
}

export async function resolveSuggestion(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  const p = z.object({ suggestionId: z.string().uuid(), status: z.enum(["accepted", "rejected"]) }).safeParse(Object.fromEntries(fd));
  if (!p.success) return errorState("Мэдээлэл буруу байна.");
  await db.update(placeEditSuggestions).set({ status: p.data.status }).where(eq(placeEditSuggestions.id, p.data.suggestionId));
  await audit({ actorId: admin.id, action: "place.suggestion", entityType: "place_edit_suggestion", entityId: p.data.suggestionId, details: { status: p.data.status } });
  revalidatePath("/admin/places");
  return successState("Хадгалагдлаа.");
}

// ── Ажлын байр ────────────────────────────────────────────────

export async function setJobStatus(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  const p = z.object({ jobId: z.string().uuid(), status: z.enum(["pending_review", "published", "closed", "rejected"]), employerVerified: checkbox }).safeParse(Object.fromEntries(fd));
  if (!p.success) return errorState("Мэдээлэл буруу байна.");
  const [j] = await db.update(jobs).set({ status: p.data.status, employerVerified: p.data.employerVerified }).where(eq(jobs.id, p.data.jobId)).returning();
  if (!j) return errorState("Ажлын байр олдсонгүй.");
  await notify(j.employerId, `Ажлын байр: ${j.title}`, p.data.status === "published" ? "Таны ажлын байр нийтлэгдлээ." : p.data.status === "rejected" ? "Таны ажлын байрыг татгалзлаа." : "Төлөв өөрчлөгдлөө.", "/jobs/mine");
  await audit({ actorId: admin.id, action: "job.status", entityType: "job", entityId: j.id, details: { status: p.data.status, verified: p.data.employerVerified } });
  revalidatePath("/admin/jobs");
  revalidatePath("/jobs");
  return successState("Хадгалагдлаа.");
}

// ── Нийгэмлэг, гомдол ─────────────────────────────────────────

export async function moderatePost(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  const p = z.object({ kind: z.enum(["post", "reply"]), targetId: z.string().uuid(), status: z.enum(["pending", "published", "hidden", "removed"]) }).safeParse(Object.fromEntries(fd));
  if (!p.success) return errorState("Мэдээлэл буруу байна.");
  if (p.data.kind === "post") await db.update(communityPosts).set({ status: p.data.status }).where(eq(communityPosts.id, p.data.targetId));
  else await db.update(communityReplies).set({ status: p.data.status }).where(eq(communityReplies.id, p.data.targetId));
  await audit({ actorId: admin.id, action: "moderate", entityType: p.data.kind, entityId: p.data.targetId, details: { status: p.data.status } });
  revalidatePath("/admin/community");
  revalidatePath("/community");
  return successState("Хадгалагдлаа.");
}

export async function setReportStatus(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  const p = z.object({ reportId: z.string().uuid(), status: z.enum(["new", "reviewing", "resolved", "dismissed"]) }).safeParse(Object.fromEntries(fd));
  if (!p.success) return errorState("Мэдээлэл буруу байна.");
  await db.update(contentReports).set({ status: p.data.status }).where(eq(contentReports.id, p.data.reportId));
  await audit({ actorId: admin.id, action: "report.status", entityType: "content_report", entityId: p.data.reportId, details: { status: p.data.status } });
  revalidatePath("/admin/community");
  return successState("Хадгалагдлаа.");
}

// ── Дэмжлэгийн хөтөлбөр ───────────────────────────────────────

export async function saveProgram(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  const p = z.object({
    id, title: req("Гарчиг", 200), organization: req("Байгууллага", 200), description: z.string().trim().min(10, "Тайлбар дор хаяж 10 тэмдэгт.").max(4000), conditions: opt(2000), howToApply: opt(2000),
    officialSourceUrl: httpsUrl, validFrom: optDate, validTo: optDate, verificationStatus: z.enum(["unverified", "community_reported", "verified"]), isPublished: checkbox,
  }).safeParse(Object.fromEntries(fd));
  if (!p.success) return zodErrorState(p.error, fd);
  const v = { title: p.data.title, organization: p.data.organization, description: p.data.description, conditions: p.data.conditions ?? "", howToApply: p.data.howToApply ?? "", officialSourceUrl: p.data.officialSourceUrl, validFrom: p.data.validFrom, validTo: p.data.validTo, verificationStatus: p.data.verificationStatus, lastVerifiedAt: p.data.verificationStatus === "verified" ? new Date() : null, isPublished: p.data.isPublished };
  if (p.data.id) await db.update(supportPrograms).set(v).where(eq(supportPrograms.id, p.data.id));
  else await db.insert(supportPrograms).values(v);
  await audit({ actorId: admin.id, action: "program.save", entityType: "support_program", entityId: p.data.id ?? null, details: { title: v.title } });
  revalidatePath("/support-programs");
  return successState("Хөтөлбөр хадгалагдлаа.");
}

// ── AI туслах ─────────────────────────────────────────────────

export async function saveAssistantConfig(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  const p = z.object({ enabled: checkbox, extraInstructions: opt(1500) }).safeParse(Object.fromEntries(fd));
  if (!p.success) return zodErrorState(p.error, fd);
  await setSetting("assistant_config", { enabled: p.data.enabled, extraInstructions: p.data.extraInstructions ?? "" });
  await audit({ actorId: admin.id, action: "assistant.config", entityType: "settings" });
  return successState("Хадгалагдлаа.");
}
