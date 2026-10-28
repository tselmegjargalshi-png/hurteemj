import Link from "next/link";

export const metadata = { title: "Хүсэлт илгээгдлээ" };

export default async function Sent({ searchParams }: { searchParams: Promise<{ ref?: string }> }) {
  const ref = ((await searchParams).ref ?? "").replace(/[^A-Z0-9-]/g, "").slice(0, 20);
  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-3xl font-bold">Хүсэлт илгээгдлээ</h1>
      <p role="status" className="notice notice-success mt-4">Таны хүсэлтийг хүлээн авлаа. Лавлах дугаар: <strong>{ref}</strong>. Дугаараа хадгалаарай. Манай ажилтан таны оруулсан холбоо барих хаягаар хариу өгнө.</p>
      <Link href="/" className="btn btn-secondary mt-6">Нүүр хуудас</Link>
    </div>
  );
}
