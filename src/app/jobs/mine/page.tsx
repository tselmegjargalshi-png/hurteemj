import { desc, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { jobApplications, jobs, users } from "@/db/schema";
import { ApplicationStatusForm, CloseJobForm } from "@/components/job-forms";
import { requireUser } from "@/lib/auth";
import { formatDateTime } from "@/lib/format";
import { APPLICATION_STATUS_LABELS, JOB_STATUS_LABELS } from "@/lib/labels";

export const metadata = { title: "Миний ажлын байрууд" };

export default async function MyJobs({ searchParams }: { searchParams: Promise<{ created?: string }> }) {
  const user = await requireUser("/jobs/mine");
  const mine = await db.select().from(jobs).where(eq(jobs.employerId, user.id)).orderBy(desc(jobs.createdAt));
  const apps = mine.length ? await db.select({ a: jobApplications, name: users.name, email: users.email }).from(jobApplications).innerJoin(users, eq(users.id, jobApplications.userId)).where(inArray(jobApplications.jobId, mine.map((j) => j.id))) : [];
  return (
    <div className="mx-auto max-w-3xl">
      {(await searchParams).created === "1" && <p role="status" className="notice notice-success mb-4 font-semibold">Ажлын байр шалгуулахаар илгээгдлээ.</p>}
      <h1 className="text-3xl font-bold">Миний ажлын байрууд</h1>
      {mine.length === 0 ? <p className="notice notice-info mt-4">Ажлын байр алга.</p> : (
        <ul className="mt-4 space-y-4" role="list">
          {mine.map((j) => (
            <li key={j.id} className="card p-5">
              <h2 className="text-xl font-bold">{j.title}</h2>
              <p>Төлөв: <strong>{JOB_STATUS_LABELS[j.status]}</strong></p>
              {j.status === "published" && <div className="mt-2"><CloseJobForm id={j.id} title={j.title} /></div>}
              <h3 className="mt-4 font-bold">Ирсэн хүсэлт ({apps.filter((x) => x.a.jobId === j.id).length})</h3>
              <ul className="mt-2 space-y-3" role="list">
                {apps.filter((x) => x.a.jobId === j.id).map(({ a, name, email }) => (
                  <li key={a.id} className="card p-3"><p className="font-semibold">{name} · {email} · {formatDateTime(a.createdAt)}</p><p>Төлөв: {APPLICATION_STATUS_LABELS[a.status]}</p><p className="mt-1 whitespace-pre-line">{a.coverLetter}</p>{a.cv && <details className="mt-1"><summary>CV харах</summary><pre className="whitespace-pre-wrap font-sans">{a.cv}</pre></details>}<div className="mt-2"><ApplicationStatusForm id={a.id} /></div></li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
