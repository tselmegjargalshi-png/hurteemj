import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { caregiverLinks, users } from "@/db/schema";
import { RespondForm, RevokeForm } from "@/components/caregiver-forms";
import { requireUser } from "@/lib/auth";

export const metadata = { title: "Асран хамгаалагчийн хэсэг" };

export default async function CaregiverHome() {
  const user = await requireUser("/caregiver");
  const rows = await db.select({ l: caregiverLinks, name: users.name }).from(caregiverLinks).innerJoin(users, eq(users.id, caregiverLinks.userId)).where(eq(caregiverLinks.caregiverId, user.id)).orderBy(desc(caregiverLinks.createdAt));
  const pending = rows.filter((r) => r.l.status === "pending");
  const active = rows.filter((r) => r.l.status === "active");
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-3xl font-bold">Асран хамгаалагчийн хэсэг</h1>
      <p className="mt-2">Та зөвхөн холбогдсон хүний зөвшөөрсөн мэдээллийг харна.</p>
      <section aria-labelledby="pend" className="mt-6"><h2 id="pend" className="text-xl font-bold">Хүлээгдэж буй урилга</h2>
        {pending.length === 0 ? <p className="mt-2">Урилга алга.</p> : <ul className="mt-2 space-y-3" role="list">{pending.map(({ l, name }) => <li key={l.id} className="card p-4"><p className="font-semibold">{name} таныг асран хамгаалагчаар урьж байна.</p><RespondForm linkId={l.id} /></li>)}</ul>}</section>
      <section aria-labelledby="act" className="mt-8"><h2 id="act" className="text-xl font-bold">Миний асарч буй хүмүүс</h2>
        {active.length === 0 ? <p className="mt-2">Идэвхтэй холбоос алга.</p> : <ul className="mt-2 space-y-3" role="list">{active.map(({ l, name }) => <li key={l.id} className="card p-4"><h3 className="font-bold"><Link href={`/caregiver/${l.userId}`} className="text-fg underline">{name}</Link></h3><div className="mt-2"><RevokeForm linkId={l.id} label="Холбоосоос гарах" /></div></li>)}</ul>}</section>
    </div>
  );
}
