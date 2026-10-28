import Link from "next/link";

export const metadata = { title: "Хүртээмжийн мэдэгдэл" };

export default function A11yStatement() {
  return (
    <div className="prose-links mx-auto max-w-3xl space-y-4">
      <h1 className="text-3xl font-bold">Хүртээмжийн мэдэгдэл</h1>
      <p>Бид энэ сайтыг WCAG 2.2 AA түвшинд нийцүүлэхийг зорьж бүтээсэн. <strong>Бүрэн нийцсэн гэж батлахгүй</strong> — нийцлийн албан ёсны аудит, бодит хэрэглэгчтэй туршилт хараахан хийгдээгүй.</p>
      <h2 className="text-xl font-bold">Хийгдсэн</h2>
      <ul className="list-disc pl-6">
        <li>Семантик HTML, дэлгэц уншигчид зориулсан тэмдэглэгээ (landmark, гарчгийн шатлал).</li>
        <li>Гарын удирдлага, «Үндсэн агуулга руу шилжих» холбоос, тод фокус.</li>
        <li>Бүх маягтад шошго, алдааны хураангуйг дэлгэц уншигчид зарлах.</li>
        <li>Өнгөний ялгарал AA, өндөр ялгаралтай горим, том үсэг, том товчлуур, хөдөлгөөн багасгах.</li>
        <li>Drag-and-drop, харагдахгүй CAPTCHA байхгүй.</li>
        <li>Автомат тест (axe-core) — тайланг репозиторийн <code>docs/ACCESSIBILITY.md</code>-д бичнэ.</li>
      </ul>
      <h2 className="text-xl font-bold">Хараахан хийгдээгүй / мэдэгдэж буй хязгаарлалт</h2>
      <ul className="list-disc pl-6">
        <li>Дэлгэц уншигчаар (NVDA, VoiceOver, TalkBack) гараар бүрэн туршаагүй.</li>
        <li>Дуугаар хайх нь хөтчийн Web Speech API-д тулгуурладаг; Монгол хэлний таних чанар хөтчөөс хамаарна.</li>
        <li>Нүдний хөдөлгөөн, толгойн удирдлага нь таны төхөөрөмж, үйлдлийн системийн дэмжлэгээр ажиллана.</li>
        <li>Дохионы хэлний автомат орчуулга байхгүй.</li>
      </ul>
      <p>Саад тотгор олдвол <Link href="/help?type=website_accessibility" className="underline">энд мэдээлнэ үү</Link>.</p>
    </div>
  );
}
