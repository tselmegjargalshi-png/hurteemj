import Link from "next/link";
import { notFound } from "next/navigation";
import { and, asc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { communityPosts, communityReplies, users } from "@/db/schema";
import { ReplyForm, ReportForm } from "@/components/community-forms";
import { getCurrentUser } from "@/lib/auth";
import { formatDateTime } from "@/lib/format";
import { POST_TYPE_LABELS } from "@/lib/labels";

export const metadata = { title: "Нийтлэл" };

export default async function PostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) notFound();
  const row = (await db.select({ p: communityPosts, author: users.name }).from(communityPosts).innerJoin(users, eq(users.id, communityPosts.authorId)).where(eq(communityPosts.id, id)).limit(1))[0];
  if (!row || row.p.status !== "published") notFound();
  const [replies, user] = await Promise.all([
    db.select({ r: communityReplies, author: users.name }).from(communityReplies).innerJoin(users, eq(users.id, communityReplies.authorId)).where(and(eq(communityReplies.postId, id), eq(communityReplies.status, "published"))).orderBy(asc(communityReplies.createdAt)),
    getCurrentUser(),
  ]);
  return (
    <div className="mx-auto max-w-3xl">
      <p className="text-muted">{POST_TYPE_LABELS[row.p.type]}</p>
      <h1 className="text-3xl font-bold">{row.p.title}</h1>
      <p className="text-sm text-muted">{row.author} · {formatDateTime(row.p.createdAt)}</p>
      <p className="mt-4 whitespace-pre-line">{row.p.body}</p>
      <ReportForm targetType="post" targetId={row.p.id} />
      <section aria-labelledby="replies" className="mt-8"><h2 id="replies" className="text-xl font-bold">Хариултууд ({replies.length})</h2>
        <ul className="mt-3 space-y-3" role="list">{replies.map(({ r, author }) => (
          <li key={r.id} className="card p-4"><p className="font-semibold">{author} <span className="font-normal text-muted">· {formatDateTime(r.createdAt)}</span></p><p className="whitespace-pre-line">{r.body}</p><ReportForm targetType="reply" targetId={r.id} /></li>
        ))}</ul></section>
      <section aria-labelledby="reply" className="card mt-6 p-5"><h2 id="reply" className="mb-3 text-xl font-bold">Хариулах</h2>
        {user ? <ReplyForm postId={row.p.id} /> : <p><Link href={`/login?next=/community/${row.p.id}`} className="underline">Нэвтэрч</Link> хариулна уу.</p>}</section>
    </div>
  );
}
