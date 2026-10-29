import Link from "next/link";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { communityPosts, users } from "@/db/schema";
import { formatDate } from "@/lib/format";
import { POST_TYPE_LABELS } from "@/lib/labels";

export const metadata = { title: "Нийгэмлэг" };
export const dynamic = "force-dynamic";

export default async function CommunityPage({ searchParams }: { searchParams: Promise<{ type?: string; submitted?: string }> }) {
  const sp = await searchParams;
  const type = sp.type && sp.type in POST_TYPE_LABELS ? (sp.type as keyof typeof POST_TYPE_LABELS) : undefined;
  const rows = await db.select({ p: communityPosts, author: users.name }).from(communityPosts).innerJoin(users, eq(users.id, communityPosts.authorId)).where(and(eq(communityPosts.status, "published"), type ? eq(communityPosts.type, type) : undefined)).orderBy(desc(communityPosts.createdAt)).limit(100);
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-3xl font-bold">Нийгэмлэг</h1>
      <p className="mt-2 text-lg">Асуулт, туршлага, арга хэмжээ, сургалт, сайн дурын тусламж, хэрэгцээт мэдээлэл.</p>
      {sp.submitted === "1" && <p role="status" className="notice notice-success mt-4 font-semibold">Нийтлэл хүлээн авлаа. Администратор хянасны дараа нийтлэгдэнэ.</p>}
      <p className="notice notice-warning mt-4">Эндх зөвлөгөө нь эмчийн зөвлөгөөг орлохгүй. Хувийн мэдээлэл бүү бичээрэй. Зохисгүй агуулгыг «Мэдээлэх» товчоор мэдэгдэнэ үү.</p>
      <nav aria-label="Төрөл" className="mt-4"><ul className="flex flex-wrap gap-2">
        <li><Link href="/community" className="nav-link" aria-current={!type ? "page" : undefined}>Бүгд</Link></li>
        {Object.entries(POST_TYPE_LABELS).map(([k, v]) => <li key={k}><Link href={`/community?type=${k}`} className="nav-link" aria-current={type === k ? "page" : undefined}>{v}</Link></li>)}
      </ul></nav>
      <p className="mt-4"><Link href="/community/new" className="btn btn-primary">Шинэ нийтлэл</Link></p>
      {rows.length === 0 ? <p className="notice notice-info mt-4">Нийтлэл алга.</p> : (
        <ul className="mt-4 space-y-3" role="list">{rows.map(({ p, author }) => (
          <li key={p.id} className="card p-4"><p className="text-sm text-muted">{POST_TYPE_LABELS[p.type]}</p><h2 className="text-lg font-bold"><Link href={`/community/${p.id}`} className="text-fg underline">{p.title}</Link></h2><p className="text-sm text-muted">{author} · {formatDate(p.createdAt)}</p></li>
        ))}</ul>
      )}
    </div>
  );
}
