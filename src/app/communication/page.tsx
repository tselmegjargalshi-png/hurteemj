import Link from "next/link";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { serviceListings, serviceProviders } from "@/db/schema";
import { integrationStatus } from "@/lib/integrations";

export const metadata = { title: "Хүртээмжтэй харилцааны хэрэгсэл" };
export const dynamic = "force-dynamic";

export default async function CommunicationPage() {
  const s = integrationStatus();
  const interpreters = await db.select({ id: serviceListings.id, name: serviceListings.name, provider: serviceProviders.name }).from(serviceListings).innerJoin(serviceProviders, eq(serviceProviders.id, serviceListings.providerId)).where(and(eq(serviceListings.category, "sign_language"), eq(serviceListings.isActive, true), eq(serviceProviders.isActive, true)));
  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <h1 className="text-3xl font-bold">Хүртээмжтэй харилцааны хэрэгсэл</h1>
      <section aria-labelledby="w"><h2 id="w" className="text-2xl font-bold">Бичгээр харилцах</h2>
        <p className="mt-2">Дуудлага шаардлагагүй. Тусламж хүсэлт, захиалгын талаарх харилцаа бүгд бичгээр, ажилтны хариу сайт доторх мэдэгдлээр ирнэ.</p>
        <p className="mt-3 flex flex-wrap gap-3"><Link href="/help" className="btn btn-primary">Бичгээр тусламж хүсэх</Link><Link href="/help/requests" className="btn btn-secondary">Миний хүсэлтүүд</Link></p></section>
      <section aria-labelledby="v"><h2 id="v" className="text-2xl font-bold">Видео дуудлага</h2>
        <p className="notice notice-warning mt-2"><strong>Холбогдоогүй.</strong> Видео дуудлагын үйлчилгээ одоогоор байхгүй. Захиалга, хүсэлтдээ «Видео дуудлага» гэж сонговол ажилтан таны оруулсан холбоо барих хаягаар гараар холбогдохыг оролдоно (баталгаагүй).</p></section>
      <section aria-labelledby="sl"><h2 id="sl" className="text-2xl font-bold">Дохионы хэлний орчуулагч</h2>
        <p className="mt-2">{s.signLanguage.note}</p>
        {interpreters.length === 0 ? <p className="notice notice-info mt-2">Одоогоор бүртгэлтэй дохионы хэлний орчуулагчийн үйлчилгээ алга.</p> : (
          <ul className="mt-2 space-y-2" role="list">{interpreters.map((i) => <li key={i.id} className="card p-3"><Link href={`/services/${i.id}`} className="font-semibold underline">{i.name}</Link> — {i.provider}</li>)}</ul>
        )}
        <p className="mt-3"><Link href="/services?category=sign_language" className="underline">Бүх орчуулагчийн үйлчилгээ</Link></p></section>
      <section aria-labelledby="vid"><h2 id="vid" className="text-2xl font-bold">Видео, хадмал</h2>
        <p className="mt-2">Одоогоор сайтад видео контент байхгүй. Видео нэмэх үед хадмал болон бичвэр тайлбар заавал хавсаргана.</p></section>
    </div>
  );
}
