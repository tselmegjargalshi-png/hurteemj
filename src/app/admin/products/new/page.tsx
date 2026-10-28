import { asc } from "drizzle-orm";
import { db } from "@/db";
import { categories } from "@/db/schema";
import { ProductForm } from "@/components/admin-forms";

export const metadata = { title: "Админ: шинэ бүтээгдэхүүн" };

export default async function NewProduct() {
  const cats = await db.select({ id: categories.id, name: categories.name }).from(categories).orderBy(asc(categories.sortOrder));
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-3xl font-bold">Шинэ бүтээгдэхүүн</h1>
      <p className="notice notice-warning my-4">Зөвхөн бодит бүтээгдэхүүн, баталгаатай мэдээлэл оруулна уу. Хуурамч бараа, үнэлгээ нэмэхгүй.</p>
      <ProductForm d={{}} cats={cats} />
    </div>
  );
}
