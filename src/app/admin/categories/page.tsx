import { asc } from "drizzle-orm";
import { db } from "@/db";
import { categories } from "@/db/schema";
import { CategoryForm } from "@/components/admin-forms";

export const metadata = { title: "Админ: ангилал" };

export default async function AdminCategories() {
  const rows = await db.select().from(categories).orderBy(asc(categories.sortOrder));
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-3xl font-bold">Ангилал</h1>
      <section className="card mt-4 p-5"><h2 className="mb-3 text-xl font-bold">Шинэ ангилал</h2><CategoryForm /></section>
      <ul className="mt-6 space-y-4" role="list">
        {rows.map((c) => <li key={c.id} className="card p-5"><CategoryForm c={c} /></li>)}
      </ul>
    </div>
  );
}
