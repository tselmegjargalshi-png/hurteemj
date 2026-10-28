import Link from "next/link";
import { notFound } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { deliveryMethods } from "@/db/schema";
import { formatMnt } from "@/lib/format";

const TITLES = { delivery: "Хүргэлтийн нөхцөл", payment: "Төлбөрийн нөхцөл", returns: "Буцаалт, баталгаа" } as const;
type Topic = keyof typeof TITLES;

export async function generateMetadata({ params }: { params: Promise<{ topic: string }> }) {
  const t = (await params).topic as Topic;
  return { title: TITLES[t] ?? "Мэдээлэл" };
}

export default async function InfoPage({ params }: { params: Promise<{ topic: string }> }) {
  const topic = (await params).topic as Topic;
  if (!(topic in TITLES)) notFound();
  const methods = topic === "delivery" ? await db.select().from(deliveryMethods).where(eq(deliveryMethods.isActive, true)).orderBy(asc(deliveryMethods.sortOrder)) : [];
  return (
    <div className="prose-links mx-auto max-w-3xl space-y-4">
      <h1 className="text-3xl font-bold">{TITLES[topic]}</h1>
      {topic === "delivery" && (
        <>
          <p>Хүргэлтийн төрөл, үнэ, хугацааг дэлгүүрийн удирдлага тохируулна. Бүтээгдэхүүн бүрийн хуудсанд тухайн бүтээгдэхүүний хүргэлтийн нөхцөл тусад нь бичигдсэн байж болно.</p>
          {methods.length ? (
            <ul className="space-y-2" role="list">
              {methods.map((m) => (
                <li key={m.id} className="card p-4"><strong>{m.name}</strong> — {m.feeMnt === 0 ? "үнэгүй" : formatMnt(m.feeMnt)}. {m.description} {m.estimatedTime && `Хугацаа: ${m.estimatedTime}.`}</li>
              ))}
            </ul>
          ) : (
            <p className="notice notice-warning">Хүргэлтийн төрөл одоогоор тохируулаагүй байна.</p>
          )}
        </>
      )}
      {topic === "payment" && (
        <>
          <p className="notice notice-warning"><strong>Онлайн төлбөр (QPay, банкны карт) одоогоор холбогдоогүй.</strong> Тиймээс сайт дээр «төлбөр амжилттай» гэж харагдахгүй.</p>
          <p>Одоогоор боломжтой хэлбэрүүд:</p>
          <ul className="list-disc pl-6">
            <li><strong>Хүлээн авахдаа төлөх</strong> — бараагаа хүлээн авахдаа төлнө.</li>
            <li><strong>Дансаар шилжүүлэх</strong> — захиалга бүртгэгдсэний дараа заасан данс руу шилжүүлнэ. Манай ажилтан гүйлгээг шалгаж төлбөрийг «Төлөгдсөн» болгоно.</li>
          </ul>
          <p>Бид таны картын мэдээллийг хэзээ ч хадгалахгүй.</p>
        </>
      )}
      {topic === "returns" && (
        <>
          <p>Буцаалт, баталгааны нөхцөл бүтээгдэхүүн бүрт өөр байж болох тул бүтээгдэхүүний хуудасны «Баталгаа, буцаалтын нөхцөл» хэсэгт заасан байна.</p>
          <p>Эрүүл ахуй, аюулгүй байдлын шалтгаанаар шалгагдсан хуучин бүтээгдэхүүн, хувийн хэрэглээний хэрэгслийн буцаалтад онцгой нөхцөл үйлчилж болно. Асуух зүйл байвал <Link href="/help" className="underline">бичгээр тусламж хүсээрэй</Link>.</p>
        </>
      )}
    </div>
  );
}
