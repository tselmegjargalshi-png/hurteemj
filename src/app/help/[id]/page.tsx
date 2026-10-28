import Link from "next/link";
import { notFound } from "next/navigation";
import { and, asc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { supportMessages, supportRequests } from "@/db/schema";
import { ReplyForm } from "@/components/support-forms";
import { requireUser } from "@/lib/auth";
import { formatDateTime } from "@/lib/format";
import { SUPPORT_STATUS_LABELS, SUPPORT_TYPE_LABELS } from "@/lib/labels";

export const metadata = { title: "Тусламжийн хүсэлт" };

export default async function RequestPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ created?: string }> }) {
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) notFound();
  const user = await requireUser(`/help/${id}`);
  const r = (await db.select().from(supportRequests).where(and(eq(supportRequests.id, id), eq(supportRequests.userId, user.id))).limit(1))[0];
  if (!r) notFound();
  const msgs = await db.select().from(supportMessages).where(eq(supportMessages.requestId, id)).orderBy(asc(supportMessages.createdAt), asc(supportMessages.id));
  return (
    <div className="mx-auto max-w-3xl">
      {(await searchParams).created === "1" && <p role="status" className="notice notice-success mb-6 font-semibold">Хүсэлт илгээгдлээ. Лавлах дугаар: {r.referenceNumber}.</p>}
      <h1 className="text-3xl font-bold">{r.subject}</h1>
      <p className="mt-2">{r.referenceNumber} · {SUPPORT_TYPE_LABELS[r.type]} · Төлөв: <strong>{SUPPORT_STATUS_LABELS[r.status]}</strong></p>
      <section aria-labelledby="thread" className="mt-6">
        <h2 id="thread" className="text-xl font-bold">Харилцаа (бичгээр)</h2>
        <ol className="mt-3 space-y-3">
          {msgs.map((m) => (
            <li key={m.id} className={`card p-4 ${m.isStaff ? "border-l-8 border-primary" : ""}`}>
              <p className="font-semibold">{m.isStaff ? "Манай ажилтан" : "Та"} · <span className="font-normal text-muted">{formatDateTime(m.createdAt)}</span></p>
              <p className="mt-1 whitespace-pre-line">{m.body}</p>
            </li>
          ))}
        </ol>
      </section>
      {r.status !== "closed" && (
        <section aria-labelledby="reply" className="card mt-6 p-5">
          <h2 id="reply" className="mb-3 text-xl font-bold">Мессеж нэмэх</h2>
          <ReplyForm requestId={r.id} />
        </section>
      )}
      <p className="mt-6"><Link href="/help/requests" className="underline">Бүх хүсэлт</Link></p>
    </div>
  );
}
