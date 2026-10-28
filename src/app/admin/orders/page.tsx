import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { orders, payments } from "@/db/schema";
import { formatDateTime, formatMnt } from "@/lib/format";
import { ORDER_STATUS_LABELS, PAYMENT_STATUS_LABELS } from "@/lib/labels";

export const metadata = { title: "Админ: захиалга" };

export default async function AdminOrders({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const status = (await searchParams).status;
  const valid = status && status in ORDER_STATUS_LABELS ? (status as keyof typeof ORDER_STATUS_LABELS) : undefined;
  const rows = await db
    .select({ id: orders.id, no: orders.orderNumber, status: orders.status, total: orders.totalMnt, name: orders.contactName, at: orders.createdAt, pay: payments.status })
    .from(orders).leftJoin(payments, eq(payments.orderId, orders.id))
    .where(valid ? eq(orders.status, valid) : undefined).orderBy(desc(orders.createdAt)).limit(200);
  return (
    <div>
      <h1 className="text-3xl font-bold">Захиалга</h1>
      <form method="get" className="mt-4 flex flex-wrap items-end gap-3" aria-label="Шүүлт">
        <div><label htmlFor="status" className="field-label">Төлөв</label>
          <select id="status" name="status" defaultValue={valid ?? ""} className="field-input">
            <option value="">Бүгд</option>
            {Object.entries(ORDER_STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select></div>
        <button className="btn btn-secondary" type="submit">Шүүх</button>
      </form>
      {rows.length === 0 ? <p className="notice notice-info mt-6">Захиалга алга.</p> : (
        <div className="table-wrap mt-6"><table className="data-table">
          <caption className="sr-only">Захиалгын жагсаалт</caption>
          <thead><tr><th scope="col">Дугаар</th><th scope="col">Хэрэглэгч</th><th scope="col">Дүн</th><th scope="col">Төлөв</th><th scope="col">Төлбөр</th><th scope="col">Огноо</th></tr></thead>
          <tbody>{rows.map((r) => (
            <tr key={r.id}><th scope="row"><Link href={`/admin/orders/${r.id}`} className="underline">{r.no}</Link></th><td>{r.name}</td><td>{formatMnt(r.total)}</td><td>{ORDER_STATUS_LABELS[r.status]}</td><td>{r.pay ? PAYMENT_STATUS_LABELS[r.pay] : "—"}</td><td>{formatDateTime(r.at)}</td></tr>
          ))}</tbody></table></div>
      )}
    </div>
  );
}
