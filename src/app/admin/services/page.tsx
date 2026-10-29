import { asc } from "drizzle-orm";
import { db } from "@/db";
import { serviceListings, serviceProviders } from "@/db/schema";
import { ListingForm, ProviderForm } from "@/components/admin-forms2";

export const metadata = { title: "Админ: үйлчилгээ" };

export default async function AdminServices() {
  const providers = await db.select().from(serviceProviders).orderBy(asc(serviceProviders.name));
  const listings = await db.select().from(serviceListings).orderBy(asc(serviceListings.name));
  return (
    <div>
      <h1 className="text-3xl font-bold">Үйлчилгээ</h1>
      <p className="mt-2">Бодит үйлчилгээ үзүүлэгчийг л бүртгэнэ. Шалгаагүй бол «баталгаажсан» гэж тэмдэглэхгүй.</p>
      <h2 className="mt-8 text-2xl font-bold">Үйлчилгээ үзүүлэгчид</h2>
      {providers.length === 0 && <p className="notice notice-info mt-3">Үзүүлэгч бүртгэгдээгүй байна.</p>}
      {providers.map((p) => <details key={p.id} className="card mt-3 p-4"><summary className="cursor-pointer font-bold">{p.name}{p.verified ? " (баталгаажсан)" : " (баталгаажаагүй)"}</summary><div className="mt-4"><ProviderForm p={p} /></div></details>)}
      <details className="card mt-3 p-4"><summary className="cursor-pointer font-bold">Шинэ үзүүлэгч нэмэх</summary><div className="mt-4"><ProviderForm /></div></details>
      <h2 className="mt-8 text-2xl font-bold">Үйлчилгээнүүд</h2>
      {listings.length === 0 && <p className="notice notice-info mt-3">Үйлчилгээ бүртгэгдээгүй байна.</p>}
      {listings.map((l) => <details key={l.id} className="card mt-3 p-4"><summary className="cursor-pointer font-bold">{l.name}</summary><div className="mt-4"><ListingForm l={l} providers={providers} /></div></details>)}
      {providers.length > 0 ? <details className="card mt-3 p-4"><summary className="cursor-pointer font-bold">Шинэ үйлчилгээ нэмэх</summary><div className="mt-4"><ListingForm providers={providers} /></div></details> : <p className="mt-3">Үйлчилгээ нэмэхийн өмнө үзүүлэгч бүртгэнэ.</p>}
    </div>
  );
}
