import { integrationStatus } from "@/lib/integrations";

export const metadata = { title: "Платформын төлөв" };
export const dynamic = "force-dynamic";

const BUILT = [
  ["Бүтээгдэхүүний каталог, хайлт, шүүлт, эрэмбэ", true],
  ["Сагс, захиалга (нөөцийн атом хасалт), захиалгын төлөв", true],
  ["Бүртгэл, нэвтрэлт, хүртээмжийн тохиргоо хадгалалт", true],
  ["Бичгээр тусламж хүсэх (чат маягийн харилцаа)", true],
  ["Админ: бүтээгдэхүүн, ангилал, захиалга, тусламжийн хүсэлт", true],
  ["Үйлчилгээ захиалга, хүртээмжтэй газрын сан, ажил, сургалт", false],
  ["Нийгэмлэг, асран хамгаалагчийн хэсэг, түрээс/засвар", false],
  ["AI туслах", false],
] as const;

export default function StatusPage() {
  const s = integrationStatus();
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-3xl font-bold">Платформын төлөв: юу ажиллаж байна</h1>
      <p className="mt-2 text-lg">Туршилтын хувилбар. Доорх жагсаалт бодит байдлыг ил тод харуулна.</p>
      <h2 className="mt-6 text-2xl font-bold">Модулиуд</h2>
      <ul className="mt-3 space-y-2" role="list">
        {BUILT.map(([name, ok]) => (
          <li key={name} className="card p-3"><span className="badge mr-2">{ok ? "Ажиллаж байна" : "Хараахан хийгдээгүй"}</span>{name}</li>
        ))}
      </ul>
      <h2 className="mt-6 text-2xl font-bold">Гадны үйлчилгээ</h2>
      <ul className="mt-3 space-y-2" role="list">
        {Object.values(s).map((i) => (
          <li key={i.name} className="card p-3"><span className="badge mr-2">{i.connected ? "Холбогдсон" : "Холбогдоогүй"}</span><strong>{i.name}</strong>. {i.note}</li>
        ))}
      </ul>
    </div>
  );
}
