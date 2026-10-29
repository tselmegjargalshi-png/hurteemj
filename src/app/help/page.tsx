import Link from "next/link";
import { SupportRequestForm } from "@/components/support-forms";
import { getCurrentUser } from "@/lib/auth";
import { integrationStatus } from "@/lib/integrations";

export const metadata = { title: "Тусламж хүсэх" };

export default async function HelpPage({ searchParams }: { searchParams: Promise<{ type?: string; subject?: string }> }) {
  const user = await getCurrentUser();
  const sp = await searchParams;
  const type = sp.type;
  const s = integrationStatus();
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-3xl font-bold">Тусламж хүсэх</h1>
      <p className="mt-3 text-lg">Хүсэлтээ бичгээр илгээнэ үү. Дуудлага шаардлагагүй. Манай ажилтан таны сонгосон хэлбэрээр хариу өгнө.</p>
      <div className="notice notice-warning my-6">
        <h2 className="font-bold">Мэдэх зүйл</h2>
        <ul className="mt-2 list-disc space-y-1 pl-6">
          <li>Яаралтай эмнэлгийн тусламж хэрэгтэй бол <strong>103</strong>-д, аврах албанд <strong>105</strong>-д, цагдаад <strong>102</strong>-т шууд залгана уу. Энэ сайт яаралтай тусламжийг орлохгүй.</li>
          <li>Хүсэлт хүлээн авсны дараа хариу өгөх хугацааг бид амлахгүй; ажилтан боломжтой үедээ хариулна.</li>
          <li>Видео дуудлага, дохионы хэлний шууд орчуулгын үйлчилгээ одоогоор холбогдоогүй ({s.signLanguage.note})</li>
        </ul>
      </div>
      {!user && <p className="mb-4">Хүсэлтийнхээ явцыг харахын тулд <Link href="/login?next=/help" className="underline">нэвтэрнэ үү</Link>.</p>}
      <div className="card p-6">
        <SupportRequestForm defaultName={user?.name ?? ""} loggedIn={!!user} defaultType={type} defaultSubject={sp.subject?.slice(0, 150)} />
      </div>
      {user && <p className="mt-6"><Link href="/help/requests" className="underline">Миний өмнөх хүсэлтүүд</Link></p>}
    </div>
  );
}
