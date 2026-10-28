import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { supportRequests } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { formatDateTime } from "@/lib/format";
import { SUPPORT_STATUS_LABELS, SUPPORT_TYPE_LABELS } from "@/lib/labels";

export const metadata = { title: "Миний тусламжийн хүсэлтүүд" };

export default async function MyRequests() {
  const user = await requireUser("/help/requests");
  const rows = await db.select().from(supportRequests).where(eq(supportRequests.userId, user.id)).orderBy(desc(supportRequests.createdAt));
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-3xl font-bold">Миний тусламжийн хүсэлтүүд</h1>
      <Link href="/help" className="btn btn-primary mt-4">Шинэ хүсэлт</Link>
      {rows.length === 0 ? <p className="notice notice-info mt-6">Хүсэлт алга.</p> : (
        <ul className="mt-6 space-y-3" role="list">
          {rows.map((r) => (
            <li key={r.id} className="card p-4">
              <h2 className="text-lg font-bold"><Link href={`/help/${r.id}`} className="text-fg underline">{r.subject}</Link></h2>
              <p>{r.referenceNumber} · {SUPPORT_TYPE_LABELS[r.type]} · <strong>{SUPPORT_STATUS_LABELS[r.status]}</strong> · {formatDateTime(r.createdAt)}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
