import Link from "next/link";
import { desc } from "drizzle-orm";
import { db } from "@/db";
import { supportRequests } from "@/db/schema";
import { formatDateTime } from "@/lib/format";
import { SUPPORT_STATUS_LABELS, SUPPORT_TYPE_LABELS } from "@/lib/labels";

export const metadata = { title: "Админ: тусламжийн хүсэлт" };

export default async function AdminSupport() {
  const rows = await db.select().from(supportRequests).orderBy(desc(supportRequests.createdAt)).limit(200);
  return (
    <div>
      <h1 className="text-3xl font-bold">Тусламжийн хүсэлтүүд</h1>
      {rows.length === 0 ? <p className="notice notice-info mt-6">Хүсэлт алга.</p> : (
        <div className="table-wrap mt-6"><table className="data-table"><caption className="sr-only">Тусламжийн хүсэлт</caption>
          <thead><tr><th scope="col">Дугаар</th><th scope="col">Гарчиг</th><th scope="col">Төрөл</th><th scope="col">Төлөв</th><th scope="col">Огноо</th></tr></thead>
          <tbody>{rows.map((r) => <tr key={r.id}><th scope="row"><Link href={`/admin/support/${r.id}`} className="underline">{r.referenceNumber}</Link></th><td>{r.subject}</td><td>{SUPPORT_TYPE_LABELS[r.type]}</td><td>{SUPPORT_STATUS_LABELS[r.status]}</td><td>{formatDateTime(r.createdAt)}</td></tr>)}</tbody></table></div>
      )}
    </div>
  );
}
