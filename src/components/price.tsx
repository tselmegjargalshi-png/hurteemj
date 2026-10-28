import { formatMnt, formatMntSpoken } from "@/lib/format";

export function Price({ value, verified, size = "base" }: { value: number; verified: boolean; size?: "base" | "lg" }) {
  return (
    <span className="inline-flex flex-wrap items-baseline gap-2">
      <span className={size === "lg" ? "text-3xl font-bold" : "text-lg font-bold"}>
        <span aria-hidden="true">{formatMnt(value)}</span>
        <span className="sr-only">{formatMntSpoken(value)}</span>
      </span>
      {!verified && (
        <span className="badge text-warning" title="Үнийг нийлүүлэгчтэй хараахан баталгаажуулаагүй">
          Үнэ баталгаажаагүй
        </span>
      )}
    </span>
  );
}

export function StockStatus({ stock }: { stock: number }) {
  if (stock <= 0) return <span className="font-semibold text-danger">Дууссан — одоогоор захиалах боломжгүй</span>;
  if (stock <= 3) return <span className="font-semibold text-warning">Цөөн үлдсэн: {stock} ширхэг</span>;
  return <span className="font-semibold text-success">Нөөцөд байгаа: {stock} ширхэг</span>;
}
