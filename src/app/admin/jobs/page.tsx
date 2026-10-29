import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { jobs, users } from "@/db/schema";
import { JobStatusForm } from "@/components/admin-forms2";
import { formatDateTime } from "@/lib/format";

export const metadata = { title: "Админ: ажлын зар" };

export default async function AdminJobs() {
  const rows = await db.select({ j: jobs, employer: users.email }).from(jobs).innerJoin(users, eq(users.id, jobs.employerId)).orderBy(desc(jobs.createdAt)).limit(200);
  return (
    <div>
      <h1 className="text-3xl font-bold">Ажлын зар</h1>
      <p className="mt-2">Зар шалгагдтал нийтэд харагдахгүй. Ажил олгогчийг шалгасны дараа л «баталгаажсан» гэж тэмдэглэнэ.</p>
      {rows.length === 0 ? <p className="notice notice-info mt-6">Зар алга.</p> : (
        <ul className="mt-6 space-y-3">{rows.map(({ j, employer }) => (
          <li key={j.id} className="card p-4">
            <p className="font-bold">{j.title} — {j.organization}</p>
            <p>{employer} · {formatDateTime(j.createdAt)}</p>
            <p className="whitespace-pre-line">{j.description}</p>
            <JobStatusForm id={j.id} status={j.status} verified={j.employerVerified} />
          </li>
        ))}</ul>
      )}
    </div>
  );
}
