import Link from "next/link";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { deliveryMethods } from "@/db/schema";
import { CheckoutForm } from "@/components/checkout-form";
import { requireUser } from "@/lib/auth";
import { getCart } from "@/lib/cart";
import { formatMnt, formatMntSpoken } from "@/lib/format";
import { getSetting } from "@/lib/settings";

export const metadata = { title: "Захиалга өгөх" };

export default async function CheckoutPage() {
  const user = await requireUser("/checkout");
  const [cart, methods, bankInfo] = await Promise.all([
    getCart(),
    db.select().from(deliveryMethods).where(eq(deliveryMethods.isActive, true)).orderBy(asc(deliveryMethods.sortOrder), asc(deliveryMethods.id)),
    getSetting("bank_transfer_info"),
  ]);
  if (!cart.lines.length) {
    return (
      <div className="mx-auto max-w-3xl">
        <h1 className="text-3xl font-bold">Захиалга өгөх</h1>
        <p className="notice notice-info mt-4">Сагс хоосон байна. <Link href="/products" className="underline">Дэлгүүр рүү очих</Link></p>
      </div>
    );
  }
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-3xl font-bold">Захиалга өгөх</h1>
      <section aria-labelledby="summary" className="card my-6 p-5">
        <h2 id="summary" className="text-xl font-bold">Таны захиалга</h2>
        <ul className="mt-2 list-disc pl-6" role="list">
          {cart.lines.map((l) => (
            <li key={l.productId}>{l.name} × {l.quantity} — <span aria-hidden="true">{formatMnt(l.priceMnt * l.quantity)}</span><span className="sr-only">{formatMntSpoken(l.priceMnt * l.quantity)}</span></li>
          ))}
        </ul>
        <p className="mt-2 font-semibold">Барааны дүн: <span aria-hidden="true">{formatMnt(cart.subtotal)}</span><span className="sr-only">{formatMntSpoken(cart.subtotal)}</span>. Хүргэлтийн төлбөр дараах алхамд нэмэгдэнэ. <Link href="/cart" className="underline">Сагс засах</Link></p>
      </section>
      <CheckoutForm methods={methods} defaults={{ name: user.name, phone: user.phone ?? "", email: user.email }} bankInfo={bankInfo} />
    </div>
  );
}
