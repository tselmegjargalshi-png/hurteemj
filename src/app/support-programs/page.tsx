import Link from "next/link";
import { and, desc, eq, gt, isNull, or } from "drizzle-orm";
import { db } from "@/db";
import { supportPrograms } from "@/db/schema";
import { formatDate } from "@/lib/format";
import { VERIFICATION_LABELS } from "@/lib/labels";

export const metadata = { title: "Хөнгөлөлт, дэмжлэгийн хөтөлбөр" };
export const dynamic = "force-dynamic";

export default async function SupportPrograms() {
  const rows = await db.select().from(supportPrograms).where(and(eq(supportPrograms.isPublished, true), or(isNull(supportPrograms.validTo), gt(supportPrograms.validTo, new Date())))).orderBy(desc(supportPrograms.createdAt));
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-3xl font-bold">Хөнгөлөлт, дэмжлэгийн хөтөлбөр</h1>
      <p className="notice notice-warning mt-4">Хөтөлбөр бүрийн албан ёсны эх сурвалж, хугацааг харуулна. «Баталгаажаагүй» хөтөлбөрийг бодит боломж гэж үзэхээсээ өмнө албан ёсны эх сурвалжаас лавлана уу.</p>
      {rows.length === 0 ? <p className="notice notice-info mt-4">Одоогоор нийтлэгдсэн хөтөлбөр алга. Бид зөвхөн албан ёсны эх сурвалжтай мэдээллийг нийтэлнэ.</p> : (
        <ul className="mt-4 space-y-4" role="list">{rows.map((p) => (
          <li key={p.id} className="card p-5"><h2 className="text-xl font-bold">{p.title}</h2><p className="text-muted">{p.organization}</p>
            <p className="mt-1"><span className="badge">{VERIFICATION_LABELS[p.verificationStatus]}</span>{p.lastVerifiedAt && ` · ${formatDate(p.lastVerifiedAt)}-д баталгаажуулсан`}</p>
            <p className="mt-2 whitespace-pre-line">{p.description}</p>
            {p.conditions && <p className="mt-2"><strong>Нөхцөл: </strong>{p.conditions}</p>}
            {p.howToApply && <p className="mt-2"><strong>Хүсэлт гаргах заавар: </strong>{p.howToApply}</p>}
            <p className="mt-2">{p.validFrom && `Хугацаа: ${formatDate(p.validFrom)}`}{p.validTo && ` – ${formatDate(p.validTo)}`}</p>
            <p className="mt-2"><a href={p.officialSourceUrl} rel="noopener noreferrer" className="underline">Албан ёсны эх сурвалж<span className="sr-only"> ({p.title})</span></a></p></li>
        ))}</ul>
      )}
      <p className="mt-6"><Link href="/help" className="underline">Асуух зүйл байвал бичгээр тусламж хүсэх</Link></p>
    </div>
  );
}
