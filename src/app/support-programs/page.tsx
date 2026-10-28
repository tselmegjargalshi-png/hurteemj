import Link from "next/link";

export const metadata = { title: "Дэмжлэгийн хөтөлбөр" };

export default function Page() {
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-3xl font-bold">Дэмжлэгийн хөтөлбөр</h1>
      <p className="notice notice-warning mt-4">
        <strong>Энэ хэсэг хараахан бэлэн болоогүй.</strong> Албан эх сурвалжтай хөнгөлөлт, дэмжлэгийн мэдээлэл — дараагийн үе шатанд хэрэгжүүлнэ. Одоогоор бодит мэдээлэл, үйлчилгээ үзүүлэгч, санал оруулаагүй тул зохиомол зүйл харуулахгүй.
      </p>
      <p className="mt-4"><Link href="/status" className="underline">Платформын төлөв</Link> · <Link href="/help" className="underline">Бичгээр тусламж хүсэх</Link></p>
    </div>
  );
}
