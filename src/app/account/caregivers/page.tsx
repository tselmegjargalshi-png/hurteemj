import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { caregiverLinks, users } from "@/db/schema";
import { InviteForm, PermForm, RevokeForm } from "@/components/caregiver-forms";
import { requireUser } from "@/lib/auth";

export const metadata = { title: "Асран хамгаалагчтай мэдээлэл хуваалцах" };

const STATUS = { pending: "Урилга хүлээгдэж байна", active: "Идэвхтэй", revoked: "Цуцлагдсан" } as const;

export default async function CaregiversPage() {
  const user = await requireUser("/account/caregivers");
  const rows = await db.select({ l: caregiverLinks, name: users.name, email: users.email }).from(caregiverLinks).innerJoin(users, eq(users.id, caregiverLinks.caregiverId)).where(eq(caregiverLinks.userId, user.id)).orderBy(desc(caregiverLinks.createdAt));
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-3xl font-bold">Асран хамгаалагчтай мэдээлэл хуваалцах</h1>
      <p className="notice notice-info mt-4">Таны зөвшөөрөлгүйгээр хэн ч таны мэдээллийг харахгүй. Та зөвшөөрлөө хүссэн үедээ өөрчилж, цуцалж болно.</p>
      <section aria-labelledby="inv" className="card mt-6 p-5"><h2 id="inv" className="mb-3 text-xl font-bold">Асран хамгаалагч урих</h2><InviteForm /></section>
      <section aria-labelledby="list" className="mt-8"><h2 id="list" className="text-xl font-bold">Миний асран хамгаалагчид</h2>
        {rows.length === 0 ? <p className="mt-2">Байхгүй.</p> : (
          <ul className="mt-3 space-y-4" role="list">{rows.map(({ l, name, email }) => (
            <li key={l.id} className="card p-4"><p className="font-bold">{name} ({email})</p><p>Төлөв: {STATUS[l.status]}</p>
              {l.status !== "revoked" && <><div className="mt-3"><PermForm linkId={l.id} o={l.canViewOrders} b={l.canViewBookings} s={l.canViewSupport} /></div><div className="mt-2"><RevokeForm linkId={l.id} /></div></>}</li>
          ))}</ul>
        )}
      </section>
    </div>
  );
}
