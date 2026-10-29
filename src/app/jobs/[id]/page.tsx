import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { jobs } from "@/db/schema";
import { ApplyForm } from "@/components/job-forms";
import { getCurrentUser } from "@/lib/auth";
import { formatDate } from "@/lib/format";

export const metadata = { title: "Ажлын байр" };

export default async function JobPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) notFound();
  const j = (await db.select().from(jobs).where(eq(jobs.id, id)).limit(1))[0];
  if (!j || j.status !== "published") notFound();
  const user = await getCurrentUser();
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-3xl font-bold">{j.title}</h1>
      <p className="mt-1 text-lg">{j.organization} {j.employerVerified ? <span className="badge">Баталгаажсан ажил олгогч</span> : <span className="badge">Ажил олгогч баталгаажаагүй</span>}</p>
      <dl className="card mt-4 grid gap-1 p-5">
        <div><dt className="inline font-semibold">Байршил: </dt><dd className="inline">{j.isRemote ? "Зайнаас ажиллах боломжтой" : j.location || "заагаагүй"}</dd></div>
        <div><dt className="inline font-semibold">Цалин: </dt><dd className="inline">{j.salaryInfo || "Ажил олгогч зарлаагүй"}</dd></div>
        {j.applyDeadline && <div><dt className="inline font-semibold">Хүсэлт хүлээх сүүлийн өдөр: </dt><dd className="inline">{formatDate(j.applyDeadline)}</dd></div>}
      </dl>
      <p className="mt-4 whitespace-pre-line">{j.description}</p>
      <section aria-labelledby="acc" className="mt-6"><h2 id="acc" className="text-xl font-bold">Хүртээмжтэй ажлын байрны нөхцөл</h2><p className="mt-1 whitespace-pre-line">{j.accessibilityInfo || "Ажил олгогч энэ талаар мэдээлэл өгөөгүй. Хүсэлт илгээхээсээ өмнө лавлаарай."}</p></section>
      <section aria-labelledby="apply" className="card mt-6 p-5"><h2 id="apply" className="mb-3 text-xl font-bold">Хүсэлт илгээх</h2>
        {user ? <ApplyForm jobId={j.id} /> : <p><Link href={`/login?next=/jobs/${j.id}`} className="underline">Нэвтэрч</Link> хүсэлт илгээнэ үү.</p>}</section>
    </div>
  );
}
