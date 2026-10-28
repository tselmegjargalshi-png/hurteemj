import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { formatDateTime, formatMnt } from "@/lib/format";
import { ORDER_STATUS_LABELS } from "@/lib/labels";

export const metadata = { title: "Миний захиалгууд" };

export default async function OrdersPage() {
  const user = await requireUser("/orders");
  const rows = await db.select().from(orders).where(eq(orders.userId, user.id)).orderBy(desc(orders.createdAt));
  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="text-3xl font-bold">Миний захиалгууд</h1>
      {rows.length === 0 ? (
        <p className="notice notice-info mt-6">Танд захиалга байхгүй байна. <Link href="/products" className="underline">Дэлгүүр рүү очих</Link></p>
      ) : (
        <ul className="mt-6 space-y-3" role="list">
          {rows.map((o) => (
            <li key={o.id} className="card p-4">
              <h2 className="text-lg font-bold"><Link href={`/orders/${o.id}`} className="text-fg underline">Захиалга {o.orderNumber}</Link></h2>
              <p>Төлөв: <strong>{ORDER_STATUS_LABELS[o.status]}</strong> · {formatDateTime(o.createdAt)} · {formatMnt(o.totalMnt)}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
