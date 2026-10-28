import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { notifications } from "@/db/schema";
import { markAllRead } from "@/app/actions/notifications";
import { requireUser } from "@/lib/auth";
import { formatDateTime } from "@/lib/format";

export const metadata = { title: "Мэдэгдлүүд" };

export default async function NotificationsPage() {
  const user = await requireUser("/account/notifications");
  const rows = await db.select().from(notifications).where(eq(notifications.userId, user.id)).orderBy(desc(notifications.createdAt)).limit(100);
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-3xl font-bold">Мэдэгдлүүд</h1>
      <p className="mt-2 text-muted">Бүх мэдэгдэл бичгээр харагдана. SMS, имэйл мэдэгдэл одоогоор холбогдоогүй.</p>
      {rows.some((r) => !r.readAt) && (
        <form action={markAllRead} className="mt-4"><button type="submit" className="btn btn-secondary">Бүгдийг уншсан болгох</button></form>
      )}
      {rows.length === 0 ? <p className="notice notice-info mt-6">Мэдэгдэл алга.</p> : (
        <ul className="mt-6 space-y-3" role="list">
          {rows.map((n) => (
            <li key={n.id} className="card p-4">
              <h2 className="font-bold">{!n.readAt && <span className="badge mr-2">Шинэ</span>}{n.link ? <Link href={n.link} className="text-fg underline">{n.title}</Link> : n.title}</h2>
              <p>{n.body}</p>
              <p className="text-sm text-muted">{formatDateTime(n.createdAt)}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
