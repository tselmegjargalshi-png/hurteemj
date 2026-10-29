"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/db";
import { jobApplications, jobs, users } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { errorState, successState, zodErrorState, type ActionState } from "@/lib/forms";
import { notify } from "@/lib/notify";
import { rateLimit } from "@/lib/rate-limit";
import { checkbox, opt, req } from "@/lib/validation";

export async function becomeEmployer(): Promise<void> {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/jobs/new");
  if (user.role === "customer") await db.update(users).set({ role: "employer", updatedAt: new Date() }).where(eq(users.id, user.id));
  redirect("/jobs/new");
}

export async function createJob(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user || (user.role !== "employer" && user.role !== "admin")) return errorState("Ажлын байр нэмэхийн тулд ажил олгогчоор бүртгүүлнэ үү.");
  const p = z
    .object({
      title: req("Ажлын байрны нэр", 200),
      organization: req("Байгууллагын нэр", 200),
      description: z.string().trim().min(20, "Тайлбар дор хаяж 20 тэмдэгт байх ёстой.").max(6000),
      location: opt(200),
      isRemote: checkbox,
      salaryInfo: opt(300),
      accessibilityInfo: opt(1500),
      applyDeadline: z.string().optional().transform((v) => (v ? new Date(v) : null)),
    })
    .safeParse(Object.fromEntries(fd));
  if (!p.success) return zodErrorState(p.error, fd);
  if (!(await rateLimit(`job:${user.id}`, 10, 60 * 60 * 24))) return errorState("Өдөрт илгээх хязгаарт хүрлээ.", fd);
  const d = p.data;
  await db.insert(jobs).values({ employerId: user.id, title: d.title, organization: d.organization, description: d.description, location: d.location ?? "", isRemote: d.isRemote, salaryInfo: d.salaryInfo ?? "", accessibilityInfo: d.accessibilityInfo ?? "", applyDeadline: d.applyDeadline && !Number.isNaN(d.applyDeadline.getTime()) ? d.applyDeadline : null });
  redirect("/jobs/mine?created=1");
}

export async function applyJob(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) return errorState("Хүсэлт илгээхийн тулд нэвтэрнэ үү.");
  const p = z.object({ jobId: z.string().uuid(), coverLetter: z.string().trim().min(10, "Танилцуулга дор хаяж 10 тэмдэгт байх ёстой.").max(4000), cv: opt(8000) }).safeParse(Object.fromEntries(fd));
  if (!p.success) return zodErrorState(p.error, fd);
  const job = (await db.select().from(jobs).where(eq(jobs.id, p.data.jobId)).limit(1))[0];
  if (!job || job.status !== "published") return errorState("Энэ ажлын байр одоогоор нээлттэй биш байна.");
  if (job.applyDeadline && job.applyDeadline.getTime() < Date.now()) return errorState("Хүсэлт хүлээн авах хугацаа дууссан байна.");
  if (job.employerId === user.id) return errorState("Өөрийн ажлын байранд хүсэлт илгээх боломжгүй.");
  const ins = await db.insert(jobApplications).values({ jobId: job.id, userId: user.id, coverLetter: p.data.coverLetter, cv: p.data.cv ?? null }).onConflictDoNothing().returning({ id: jobApplications.id });
  if (!ins.length) return errorState("Та энэ ажлын байранд хүсэлт илгээсэн байна.");
  await notify(job.employerId, `Шинэ хүсэлт: ${job.title}`, `${user.name} ажлын байранд хүсэлт илгээлээ.`, "/jobs/mine");
  await notify(user.id, "Ажлын хүсэлт илгээгдлээ", `«${job.title}» ажлын байранд хүсэлт илгээгдлээ. Энэ нь ажилд авах амлалт биш.`, "/jobs/applications");
  return successState("Хүсэлт илгээгдлээ. Ажил олгогч хянасны дараа холбогдоно. Энэ нь ажилд авах амлалт биш.");
}

export async function setApplicationStatus(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) return errorState("Нэвтэрнэ үү.");
  const p = z.object({ applicationId: z.string().uuid(), status: z.enum(["reviewed", "accepted", "rejected"]) }).safeParse(Object.fromEntries(fd));
  if (!p.success) return errorState("Төлөв буруу байна.");
  const row = (await db.select({ a: jobApplications, j: jobs }).from(jobApplications).innerJoin(jobs, eq(jobs.id, jobApplications.jobId)).where(eq(jobApplications.id, p.data.applicationId)).limit(1))[0];
  if (!row || (row.j.employerId !== user.id && user.role !== "admin")) return errorState("Хүсэлт олдсонгүй.");
  await db.update(jobApplications).set({ status: p.data.status }).where(eq(jobApplications.id, row.a.id));
  await notify(row.a.userId, `Ажлын хүсэлт: ${row.j.title}`, "Таны хүсэлтийн төлөв өөрчлөгдлөө.", "/jobs/applications");
  revalidatePath("/jobs/mine");
  return successState("Төлөв шинэчлэгдлээ.");
}

export async function closeJob(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) return errorState("Нэвтэрнэ үү.");
  const id = z.string().uuid().safeParse(fd.get("jobId"));
  if (!id.success) return errorState("Ажлын байр олдсонгүй.");
  const r = await db.update(jobs).set({ status: "closed" }).where(and(eq(jobs.id, id.data), eq(jobs.employerId, user.id))).returning({ id: jobs.id });
  if (!r.length) return errorState("Ажлын байр олдсонгүй.");
  revalidatePath("/jobs/mine");
  return successState("Ажлын байр хаагдлаа.");
}
