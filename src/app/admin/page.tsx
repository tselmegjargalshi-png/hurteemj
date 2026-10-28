import Link from "next/link";
import { count, eq, lte, sql } from "drizzle-orm";
import { db } from "@/db";
import { orders, payments, products, supportRequests, users } from "@/db/schema";
import { formatMnt } from "@/lib/format";
import { integrationStatus } from "@/lib/integrations";
import { ORDER_STATUS_LABELS } from "@/lib/labels";

export const metadata = { title: "Админ" };
export const dynamic = "force-dynamic";

export default async function AdminHome() {
  const [byStatus, lowStock, openSupport, userCount, revenue] = await Promise.all([
    db.select({ status: orders.status, n: count() }).from(orders).groupBy(orders.status),
    db.select({ n: count() }).from(products).where(lte(products.stock, 3)),
    db.select({ n: count() }).from(supportRequests).where(sql`${supportRequests.status} in ('new','in_progress','waiting_customer')`),
    db.select({ n: count() }).from(users),
    db.select({ sum: sql<number>`coalesce(sum(${payments.amountMnt}), 0)`.mapWith(Number) }).from(payments).where(eq(payments.status, "paid")),
  ]);
  const s = integrationStatus();
  return (
    <div>
      <h1 className="text-3xl font-bold">Хяналтын самбар</h1>
      <h2 className="mt-6 text-xl font-bold">Захиалга (төлвөөр)</h2>
      <ul className="mt-2 grid gap-3 sm:grid-cols-3" role="list">
        {(Object.keys(ORDER_STATUS_LABELS) as (keyof typeof ORDER_STATUS_LABELS)[]).map((k) => (
          <li key={k} className="card p-4"><p className="text-2xl font-bold">{byStatus.find((b) => b.status === k)?.n ?? 0}</p><p>{ORDER_STATUS_LABELS[k]}</p></li>
        ))}
      </ul>
      <ul className="mt-6 grid gap-3 sm:grid-cols-4" role="list">
        <li className="card p-4"><p className="text-2xl font-bold">{formatMnt(revenue[0]?.sum ?? 0)}</p><p>Баталгаажсан төлбөр</p></li>
        <li className="card p-4"><p className="text-2xl font-bold">{lowStock[0]?.n ?? 0}</p><p><Link href="/admin/products" className="underline">Нөөц ≤ 3 бүтээгдэхүүн</Link></p></li>
        <li className="card p-4"><p className="text-2xl font-bold">{openSupport[0]?.n ?? 0}</p><p><Link href="/admin/support" className="underline">Нээлттэй тусламжийн хүсэлт</Link></p></li>
        <li className="card p-4"><p className="text-2xl font-bold">{userCount[0]?.n ?? 0}</p><p>Хэрэглэгч</p></li>
      </ul>
      <h2 className="mt-8 text-xl font-bold">Холболтын төлөв</h2>
      <ul className="mt-2 space-y-2" role="list">
        {Object.values(s).map((i) => <li key={i.name} className="card p-3"><span className="badge mr-2">{i.connected ? "Холбогдсон" : "Холбогдоогүй"}</span><strong>{i.name}</strong>: {i.note}</li>)}
      </ul>
    </div>
  );
}
