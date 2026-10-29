import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { communityPosts, communityReplies, contentReports, users } from "@/db/schema";
import { ModerateForm, ReportStatusForm } from "@/components/admin-forms2";
import { formatDateTime } from "@/lib/format";
import { POST_TYPE_LABELS } from "@/lib/labels";

export const metadata = { title: "Админ: нийгэмлэг" };

export default async function AdminCommunity() {
  const reports = await db.select().from(contentReports).orderBy(desc(contentReports.createdAt)).limit(100);
  const posts = await db.select({ p: communityPosts, author: users.name }).from(communityPosts).innerJoin(users, eq(users.id, communityPosts.authorId)).orderBy(desc(communityPosts.createdAt)).limit(100);
  const replies = await db.select({ r: communityReplies, author: users.name }).from(communityReplies).innerJoin(users, eq(users.id, communityReplies.authorId)).orderBy(desc(communityReplies.createdAt)).limit(100);
  return (
    <div>
      <h1 className="text-3xl font-bold">Нийгэмлэгийн модераци</h1>
      <h2 className="mt-6 text-2xl font-bold">Гомдол ({reports.filter((r) => r.status === "new").length} шинэ)</h2>
      {reports.length === 0 ? <p className="notice notice-info mt-3">Гомдол алга.</p> : (
        <ul className="mt-3 space-y-3">{reports.map((r) => <li key={r.id} className="card p-4"><p className="font-bold">{r.targetType} · {r.reason} · {formatDateTime(r.createdAt)}</p>{r.details && <p>{r.details}</p>}<p className="text-sm">Объектын id: {r.targetId}</p><ReportStatusForm id={r.id} status={r.status} /></li>)}</ul>
      )}
      <h2 className="mt-8 text-2xl font-bold">Нийтлэлүүд</h2>
      {posts.length === 0 ? <p className="notice notice-info mt-3">Нийтлэл алга.</p> : (
        <ul className="mt-3 space-y-3">{posts.map(({ p, author }) => <li key={p.id} className="card p-4"><p className="font-bold">{p.title} <span className="font-normal">({POST_TYPE_LABELS[p.type]}, {author})</span></p><p className="whitespace-pre-line">{p.body}</p><ModerateForm kind="post" id={p.id} status={p.status} /></li>)}</ul>
      )}
      <h2 className="mt-8 text-2xl font-bold">Хариултууд</h2>
      {replies.length === 0 ? <p className="notice notice-info mt-3">Хариулт алга.</p> : (
        <ul className="mt-3 space-y-3">{replies.map(({ r, author }) => <li key={r.id} className="card p-4"><p>{author}: {r.body}</p><ModerateForm kind="reply" id={r.id} status={r.status} /></li>)}</ul>
      )}
    </div>
  );
}
