import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { categories, products } from "@/db/schema";
import { formatMnt } from "@/lib/format";
import { PRODUCT_STATUS_LABELS } from "@/lib/labels";

export const metadata = { title: "Админ: бүтээгдэхүүн" };

export default async function AdminProducts() {
  const rows = await db.select({ id: products.id, name: products.name, price: products.priceMnt, verified: products.priceVerified, stock: products.stock, status: products.status, cat: categories.name }).from(products).innerJoin(categories, eq(categories.id, products.categoryId)).orderBy(desc(products.updatedAt));
  return (
    <div>
      <h1 className="text-3xl font-bold">Бүтээгдэхүүн</h1>
      <Link href="/admin/products/new" className="btn btn-primary mt-4">Шинэ бүтээгдэхүүн нэмэх</Link>
      {rows.length === 0 ? <p className="notice notice-info mt-6">Бүтээгдэхүүн алга. Бодит бүтээгдэхүүнийг энд нэмнэ.</p> : (
        <div className="table-wrap mt-6">
          <table className="data-table">
            <caption className="sr-only">Бүтээгдэхүүний жагсаалт</caption>
            <thead><tr><th scope="col">Нэр</th><th scope="col">Ангилал</th><th scope="col">Үнэ</th><th scope="col">Нөөц</th><th scope="col">Төлөв</th></tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <th scope="row"><Link href={`/admin/products/${r.id}`} className="underline">{r.name}</Link></th>
                  <td>{r.cat}</td><td>{formatMnt(r.price)}{!r.verified && " (баталгаажаагүй)"}</td><td>{r.stock}</td><td>{PRODUCT_STATUS_LABELS[r.status]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
