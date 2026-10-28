import Link from "next/link";
import { and, count, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { notifications } from "@/db/schema";
import { logout } from "@/app/actions/auth";
import { requireUser } from "@/lib/auth";
import { ROLE_LABELS } from "@/lib/labels";

export const metadata = { title: "Миний бүртгэл" };

export default async function AccountPage({ searchParams }: { searchParams: Promise<{ welcome?: string }> }) {
  const user = await requireUser("/account");
  const unread = (await db.select({ n: count() }).from(notifications).where(and(eq(notifications.userId, user.id), isNull(notifications.readAt))))[0]?.n ?? 0;
  const welcome = (await searchParams).welcome === "1";
  return (
    <div className="mx-auto max-w-3xl">
      {welcome && <p role="status" className="notice notice-success mb-6 font-semibold">Бүртгэл амжилттай үүслээ. Тавтай морил, {user.name}!</p>}
      <h1 className="text-3xl font-bold">Миний бүртгэл</h1>
      <dl className="card mt-4 grid gap-1 p-5">
        <div><dt className="inline font-semibold">Нэр: </dt><dd className="inline">{user.name}</dd></div>
        <div><dt className="inline font-semibold">Имэйл: </dt><dd className="inline">{user.email}</dd></div>
        <div><dt className="inline font-semibold">Утас: </dt><dd className="inline">{user.phone ?? "оруулаагүй"}</dd></div>
        <div><dt className="inline font-semibold">Эрх: </dt><dd className="inline">{ROLE_LABELS[user.role]}</dd></div>
      </dl>
      <ul className="mt-6 grid gap-3 sm:grid-cols-2" role="list">
        <li><Link href="/orders" className="card block p-4 font-semibold text-fg underline">Миний захиалгууд</Link></li>
        <li><Link href="/account/notifications" className="card block p-4 font-semibold text-fg underline">Мэдэгдлүүд {unread > 0 && `(${unread} уншаагүй)`}</Link></li>
        <li><Link href="/account/wishlist" className="card block p-4 font-semibold text-fg underline">Хадгалах жагсаалт</Link></li>
        <li><Link href="/help/requests" className="card block p-4 font-semibold text-fg underline">Миний тусламжийн хүсэлтүүд</Link></li>
        <li><Link href="/settings/accessibility" className="card block p-4 font-semibold text-fg underline">Хүртээмжийн тохиргоо</Link></li>
      </ul>
      <form action={logout} className="mt-8"><button type="submit" className="btn btn-secondary">Гарах</button></form>
    </div>
  );
}
