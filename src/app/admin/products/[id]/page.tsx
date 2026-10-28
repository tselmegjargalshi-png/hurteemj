import Link from "next/link";
import { notFound } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { categories, productImages, products } from "@/db/schema";
import { DeleteImageForm, ProductForm } from "@/components/admin-forms";

export const metadata = { title: "Админ: бүтээгдэхүүн засах" };

export default async function EditProduct({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ saved?: string }> }) {
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) notFound();
  const p = (await db.select().from(products).where(eq(products.id, id)).limit(1))[0];
  if (!p) notFound();
  const [cats, images] = await Promise.all([
    db.select({ id: categories.id, name: categories.name }).from(categories).orderBy(asc(categories.sortOrder)),
    db.select().from(productImages).where(eq(productImages.productId, id)).orderBy(asc(productImages.sortOrder)),
  ]);
  return (
    <div className="mx-auto max-w-3xl">
      {(await searchParams).saved === "1" && <p role="status" className="notice notice-success mb-4 font-semibold">Бүтээгдэхүүн үүслээ.</p>}
      <h1 className="text-3xl font-bold">{p.name}</h1>
      <p className="mt-1"><Link href={`/products/${p.slug}`} className="underline">Сайт дээр харах</Link>{p.status !== "published" && " (нийтлэгдээгүй тул зочдод харагдахгүй)"}</p>
      <ProductForm
        cats={cats}
        d={{ ...p, specifications: p.specifications.map((s) => `${s.label}: ${s.value}`).join("\n") }}
      />
      <section aria-labelledby="imgs" className="mt-10">
        <h2 id="imgs" className="text-2xl font-bold">Зургууд</h2>
        {images.length === 0 ? <p className="mt-2 text-muted">Зураг алга.</p> : (
          <ul className="mt-3 space-y-3" role="list">
            {images.map((i) => (
              <li key={i.id} className="card flex flex-wrap items-center gap-4 p-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={i.url} alt={i.alt} className="h-24 w-24 rounded object-contain" />
                <div className="flex-1"><p>Alt: {i.alt}</p>{i.credit && <p className="text-sm text-muted">Эх сурвалж: {i.credit}</p>}{i.isAiGenerated && <p className="badge">AI-аар бүтээсэн</p>}</div>
                <DeleteImageForm imageId={i.id} alt={i.alt} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
