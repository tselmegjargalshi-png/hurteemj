import Link from "next/link";

export const metadata = { title: "Хуудас олдсонгүй" };
export default function NotFound() {
  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-3xl font-bold">Хуудас олдсонгүй</h1>
      <p className="mt-3 text-lg">Таны хайсан хуудас байхгүй эсвэл зөөгдсөн байна.</p>
      <p className="mt-4 flex flex-wrap gap-3">
        <Link href="/" className="btn btn-primary">Нүүр хуудас</Link>
        <Link href="/products" className="btn btn-secondary">Дэлгүүр</Link>
        <Link href="/help" className="btn btn-secondary">Тусламж хүсэх</Link>
      </p>
    </div>
  );
}
