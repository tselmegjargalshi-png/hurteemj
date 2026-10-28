import Link from "next/link";
import { categoriesWithCounts } from "@/lib/products";

export const metadata = { title: "Ангилал" };
export const dynamic = "force-dynamic";

export default async function CategoriesPage() {
  const cats = await categoriesWithCounts();
  return (
    <div>
      <h1 className="text-3xl font-bold">Бүтээгдэхүүний ангилал</h1>
      <ul className="mt-6 grid gap-4 md:grid-cols-2" role="list">
        {cats.map((c) => (
          <li key={c.id} className="card p-5">
            <h2 className="text-lg font-bold">
              <Link href={`/products?category=${c.slug}`} className="text-fg underline">{c.name}</Link>
            </h2>
            <p className="mt-1 text-muted">{c.description}</p>
            <p className="mt-2 text-sm">{c.productCount} бүтээгдэхүүн</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
