import { asc } from "drizzle-orm";
import { db } from "@/db";
import { deliveryMethods } from "@/db/schema";
import { DeliveryForm } from "@/components/admin-forms";

export const metadata = { title: "Админ: хүргэлтийн төрөл" };

export default async function AdminDelivery() {
  const rows = await db.select().from(deliveryMethods).orderBy(asc(deliveryMethods.sortOrder), asc(deliveryMethods.id));
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-3xl font-bold">Хүргэлтийн төрөл</h1>
      <p className="notice notice-info mt-4">Хүргэлтийн төрөл нэмэх хүртэл худалдан авагч захиалга өгөх боломжгүй.</p>
      <section className="card mt-4 p-5"><h2 className="mb-3 text-xl font-bold">Шинэ</h2><DeliveryForm /></section>
      <ul className="mt-6 space-y-4" role="list">{rows.map((m) => <li key={m.id} className="card p-5"><DeliveryForm m={m} /></li>)}</ul>
    </div>
  );
}
