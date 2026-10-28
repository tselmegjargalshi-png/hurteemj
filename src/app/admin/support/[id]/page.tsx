import { notFound } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { supportMessages, supportRequests } from "@/db/schema";
import { SupportAdminForm } from "@/components/admin-forms";
import { formatDateTime } from "@/lib/format";
import { CONTACT_PREFERENCE_LABELS, SUPPORT_TYPE_LABELS } from "@/lib/labels";

export const metadata = { title: "Админ: тусламжийн хүсэлт" };

export default async function AdminSupportItem({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) notFound();
  const r = (await db.select().from(supportRequests).where(eq(supportRequests.id, id)).limit(1))[0];
  if (!r) notFound();
  const msgs = await db.select().from(supportMessages).where(eq(supportMessages.requestId, id)).orderBy(asc(supportMessages.createdAt));
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-3xl font-bold">{r.subject}</h1>
      <p className="mt-2">{r.referenceNumber} · {SUPPORT_TYPE_LABELS[r.type]} · {r.contactName}</p>
      <p>Хариу өгөх хэлбэр: <strong>{CONTACT_PREFERENCE_LABELS[r.contactPreference]}</strong>{r.contactValue && ` — ${r.contactValue}`}</p>
      <ol className="mt-4 space-y-3">{msgs.map((m) => <li key={m.id} className="card p-4"><p className="font-semibold">{m.isStaff ? "Ажилтан" : "Хэрэглэгч"} · <span className="font-normal text-muted">{formatDateTime(m.createdAt)}</span></p><p className="whitespace-pre-line">{m.body}</p></li>)}</ol>
      <section className="card mt-6 p-5"><h2 className="mb-3 text-xl font-bold">Хариу бичих</h2><SupportAdminForm requestId={id} status={r.status} /></section>
    </div>
  );
}
