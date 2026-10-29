import Link from "next/link";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { jobs } from "@/db/schema";
import { formatDate } from "@/lib/format";

export const metadata = { title: "Ажил, сургалт" };
export const dynamic = "force-dynamic";

export default async function JobsPage({ searchParams }: { searchParams: Promise<{ remote?: string; q?: string }> }) {
  const sp = await searchParams;
  const rows = await db.select().from(jobs).where(and(eq(jobs.status, "published"), sp.remote === "1" ? eq(jobs.isRemote, true) : undefined)).orderBy(desc(jobs.createdAt));
  const q = sp.q?.trim().toLowerCase();
  const items = rows.filter((j) => !q || `${j.title} ${j.organization} ${j.description}`.toLowerCase().includes(q));
  return (
    <div>
      <h1 className="text-3xl font-bold">Ажил, сургалт, орлогын боломж</h1>
      <ul className="mt-4 flex flex-wrap gap-3" role="list">
        <li><Link href="/jobs/cv" className="btn btn-secondary">CV үүсгэх туслах</Link></li>
        <li><Link href="/community?type=training" className="btn btn-secondary">Ур чадварын сургалт</Link></li>
        <li><Link href="/jobs/new" className="btn btn-secondary">Ажил олгогчоор бүртгүүлэх, ажлын байр нэмэх</Link></li>
        <li><Link href="/jobs/applications" className="btn btn-secondary">Миний хүсэлтүүд</Link></li>
      </ul>
      <form method="get" role="search" aria-label="Ажил хайх" className="card mt-6 flex flex-wrap items-end gap-3 p-4">
        <div className="flex-1 basis-56"><label htmlFor="q" className="field-label">Хайх үг</label><input id="q" name="q" type="search" defaultValue={sp.q} className="field-input" /></div>
        <label className="check-row"><input type="checkbox" name="remote" value="1" defaultChecked={sp.remote === "1"} /><span>Зөвхөн зайнаас ажиллах</span></label>
        <button type="submit" className="btn btn-primary">Хайх</button>
      </form>
      <p className="mt-4" role="status">{items.length} ажлын байр олдлоо.</p>
      {items.length === 0 ? <p className="notice notice-info mt-4">Одоогоор нийтлэгдсэн ажлын байр алга. Бид зөвхөн баталгаажсан ажил олгогчийн бодит зарыг нийтэлнэ.</p> : (
        <ul className="mt-4 space-y-4" role="list">
          {items.map((j) => (
            <li key={j.id} className="card p-5">
              <h2 className="text-xl font-bold"><Link href={`/jobs/${j.id}`} className="text-fg underline">{j.title}</Link></h2>
              <p>{j.organization} {j.employerVerified ? <span className="badge">Баталгаажсан ажил олгогч</span> : <span className="badge">Ажил олгогч баталгаажаагүй</span>}</p>
              <p>{j.isRemote ? "Зайнаас ажиллах боломжтой" : j.location}{j.applyDeadline && ` · Хүсэлт хүлээх: ${formatDate(j.applyDeadline)} хүртэл`}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
