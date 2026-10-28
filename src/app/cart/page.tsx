import Link from "next/link";
import { CartView } from "@/components/cart-forms";
import { formatMnt, formatMntSpoken } from "@/lib/format";
import { getCart } from "@/lib/cart";

export const metadata = { title: "Сагс" };

export default async function CartPage() {
  const cart = await getCart();
  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="text-3xl font-bold">Сагс</h1>
      {cart.lines.length === 0 ? (
        <div className="notice notice-info mt-6">
          <p className="font-semibold">Таны сагс хоосон байна.</p>
          <Link href="/products" className="btn btn-primary mt-3">Дэлгүүр рүү очих</Link>
        </div>
      ) : (
        <p className="mt-2">Сагсанд {cart.count} бараа байна.</p>
      )}
      <div className="mt-6">
        <CartView lines={cart.lines} />
      </div>
      {cart.lines.length > 0 && (
        <section aria-labelledby="sum-title" className="card mt-6 p-5">
          <h2 id="sum-title" className="text-xl font-bold">Дүн</h2>
          <p className="mt-2 text-lg">
            Барааны дүн: <strong><span aria-hidden="true">{formatMnt(cart.subtotal)}</span><span className="sr-only">{formatMntSpoken(cart.subtotal)}</span></strong>
          </p>
          <p className="text-muted">Хүргэлтийн төлбөрийг дараагийн алхамд сонгоно.</p>
          <Link href="/checkout" className="btn btn-primary mt-4">Захиалга өгөх</Link>
        </section>
      )}
    </div>
  );
}
