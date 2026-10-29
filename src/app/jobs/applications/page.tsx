import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { jobApplications, jobs } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { formatDateTime } from "@/lib/format";
import { APPLICATION_STATUS_LABELS } from "@/lib/labels";

export const metadata = { title: "Миний ажлын хүсэлтүүд" };

export default async function MyApplications() {
  const user = await requireUser("/jobs/applications");
  const rows = await db.select({ a: jobApplications, title: jobs.title, org: jobs.organization }).from(jobApplications).innerJoin(jobs, eq(jobs.id, jobApplications.jobId)).where(eq(jobApplications.userId, user.id)).orderBy(desc(jobApplications.createdAt));
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-3xl font-bold">Миний ажлын хүсэлтүүд</h1>
      {rows.length === 0 ? <p className="notice notice-info mt-4">Хүсэлт алга.</p> : (
        <ul className="mt-4 space-y-3" role="list">{rows.map(({ a, title, org }) => <li key={a.id} className="card p-4"><h2 className="font-bold">{title}</h2><p>{org} · {formatDateTime(a.createdAt)} · <strong>{APPLICATION_STATUS_LABELS[a.status]}</strong></p></li>)}</ul>
      )}
    </div>
  );
}
