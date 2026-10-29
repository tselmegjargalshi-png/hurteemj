"use client";

import { useActionState, useEffect, useRef } from "react";
import Link from "next/link";
import { formatMnt, formatMntSpoken } from "@/lib/format";
import type { ActionState } from "@/lib/forms";
import { addToCart, removeFromCart, updateCartQuantity } from "@/app/actions/cart";
import { toggleWishlist } from "@/app/actions/wishlist";
import { initialState } from "@/lib/forms";
import { SubmitButton } from "./form";

function Status({ state }: { state: typeof initialState }) {
  return (
    <div role="status" aria-live="polite" className="min-h-6">
      {state.status === "success" && <p className="notice notice-success mt-3 font-semibold">{state.message}</p>}
      {state.status === "error" && (
        <p className="notice notice-danger mt-3 font-semibold">
          <span className="sr-only">Алдаа: </span>
          {state.message}
        </p>
      )}
    </div>
  );
}

export function AddToCartForm({ productId, productName, maxQty }: { productId: string; productName: string; maxQty: number }) {
  const [state, action] = useActionState(addToCart, initialState);
  return (
    <form action={action} className="mt-6" noValidate>
      <input type="hidden" name="productId" value={productId} />
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label htmlFor="qty" className="field-label">Тоо ширхэг</label>
          <select id="qty" name="quantity" className="field-input w-28" defaultValue="1">
            {Array.from({ length: Math.min(maxQty, 20) }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </div>
        <SubmitButton pendingText="Нэмж байна…">
          Сагсанд нэмэх<span className="sr-only"> {productName}</span>
        </SubmitButton>
      </div>
      <Status state={state} />
    </form>
  );
}

export function WishlistForm({ productId, saved, loggedIn }: { productId: string; saved: boolean; loggedIn: boolean }) {
  const [state, action] = useActionState(toggleWishlist, initialState);
  if (!loggedIn) return null;
  return (
    <form action={action}>
      <input type="hidden" name="productId" value={productId} />
      <SubmitButton variant="secondary" pendingText="Хадгалж байна…">
        {saved ? "Хадгалах жагсаалтаас хасах" : "Хадгалах жагсаалтад нэмэх"}
      </SubmitButton>
      <Status state={state} />
    </form>
  );
}

type Line = {
  productId: string;
  slug: string;
  name: string;
  priceMnt: number;
  stock: number;
  quantity: number;
  status: string;
  image: { url: string; alt: string } | null;
};

/**
 * Сагс: бүх үйлдлийн мэдэгдэл нэг live region-д зарлагдана (мөр устсан ч мэдэгдэл алдагдахгүй).
 * Хассан барааг "Буцаах" товчоор сэргээнэ.
 */
export function CartView({ lines }: { lines: Line[] }) {
  const [uState, uAction] = useActionState(updateCartQuantity, initialState);
  const [rState, rAction] = useActionState(removeFromCart, initialState);
  const [aState, aAction] = useActionState(addToCart, initialState);
  const latest = [uState, rState, aState].sort((a, b) => (b.submissionId ?? 0) - (a.submissionId ?? 0))[0];
  const undo = latest === rState && rState.status === "success" ? rState.values : undefined;
  const msgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Мөр хасагдах үед фокус алга болохоос сэргийлж мэдэгдэл рүү шилжүүлнэ.
    if (latest === rState && rState.status !== "idle") msgRef.current?.focus();
  }, [latest, rState]);

  return (
    <div>
      <div ref={msgRef} tabIndex={-1} role="status" aria-live="polite" className="focus:outline-none">
        {latest.status !== "idle" && (
          <div className={`notice ${latest.status === "error" ? "notice-danger" : "notice-success"} mb-4`}>
            <p className="font-semibold">{latest.message}</p>
            {undo?.undoProductId && (
              <form action={aAction} className="mt-2">
                <input type="hidden" name="productId" value={undo.undoProductId} />
                <input type="hidden" name="quantity" value={undo.undoQuantity} />
                <SubmitButton variant="secondary" pendingText="Буцааж байна…">
                  Буцаах<span className="sr-only"> {undo.undoName}-г сагсанд эргүүлж нэмэх</span>
                </SubmitButton>
              </form>
            )}
          </div>
        )}
      </div>
      {lines.length > 0 && (
        <ul className="space-y-4" role="list" aria-label="Сагсан дахь бараа">
          {lines.map((l) => (
            <li key={l.productId} className="card flex flex-col gap-4 p-4 sm:flex-row">
              <div className="h-28 w-28 shrink-0 overflow-hidden rounded-lg bg-surface-2">
                {l.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={l.image.url} alt="" className="h-full w-full object-contain" />
                ) : null}
              </div>
              <div className="flex-1 space-y-2">
                <h2 className="text-lg font-bold">
                  <Link href={`/products/${l.slug}`} className="text-fg underline">{l.name}</Link>
                </h2>
                <p>
                  Нэгж үнэ: <span aria-hidden="true">{formatMnt(l.priceMnt)}</span>
                  <span className="sr-only">{formatMntSpoken(l.priceMnt)}</span>
                  {" · "}Дүн: <span aria-hidden="true">{formatMnt(l.priceMnt * l.quantity)}</span>
                  <span className="sr-only">{formatMntSpoken(l.priceMnt * l.quantity)}</span>
                </p>
                {(l.status !== "published" || l.stock < l.quantity) && (
                  <p className="font-semibold text-danger">
                    {l.status !== "published" ? "Энэ бараа худалдаанаас хасагдсан. Захиалахын өмнө сагснаас хасна уу." : `Нөөцөд зөвхөн ${l.stock} ширхэг байна. Тоо ширхэгээ багасгана уу.`}
                  </p>
                )}
                <div className="flex flex-wrap items-end gap-3">
                  <LineQty line={l} action={uAction} />
                  <form action={rAction}>
                    <input type="hidden" name="productId" value={l.productId} />
                    <input type="hidden" name="prevQuantity" value={l.quantity} />
                    <SubmitButton variant="danger" pendingText="Хасаж байна…">
                      Хасах<span className="sr-only"> {l.name}</span>
                    </SubmitButton>
                  </form>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function LineQty({ line, action }: { line: Line; action: (fd: FormData) => void }) {
  const max = Math.max(1, Math.min(line.stock, 20));
  const options = Array.from({ length: max }, (_, i) => i + 1);
  if (!options.includes(line.quantity)) options.push(line.quantity);
  return (
    <form action={action} className="flex flex-wrap items-end gap-2" noValidate>
      <input type="hidden" name="productId" value={line.productId} />
      <div>
        <label htmlFor={`qty-${line.productId}`} className="field-label">
          Тоо ширхэг<span className="sr-only"> {line.name}</span>
        </label>
        <select key={line.quantity} id={`qty-${line.productId}`} name="quantity" defaultValue={String(line.quantity)} className="field-input w-24">
          {options.map((n) => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>
      </div>
      <SubmitButton variant="secondary" pendingText="Шинэчилж байна…">
        Шинэчлэх<span className="sr-only"> тоо ширхэг: {line.name}</span>
      </SubmitButton>
    </form>
  );
}

export type { ActionState };
