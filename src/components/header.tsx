import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { getCart } from "@/lib/cart";
import { NavLinks } from "./nav-links";

export const MAIN_NAV = [
  { href: "/products", label: "Дэлгүүр" },
  { href: "/services", label: "Үйлчилгээ" },
  { href: "/places", label: "Хүртээмжтэй газар" },
  { href: "/jobs", label: "Ажил, сургалт" },
  { href: "/help", label: "Тусламж" },
];

export async function Header() {
  const [user, cart] = await Promise.all([getCurrentUser(), getCart()]);
  return (
    <header className="border-b border-border-soft bg-surface">
      <div className="container-page flex flex-wrap items-center justify-between gap-3 py-3">
        <Link href="/" className="flex items-center gap-2 text-xl font-bold text-fg no-underline">
          <span aria-hidden="true" className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-fg">
            Х
          </span>
          <span>Хүртээмж</span>
          <span className="sr-only">— нүүр хуудас</span>
        </Link>
        <nav aria-label="Хэрэглэгчийн цэс">
          <ul className="flex flex-wrap items-center gap-1">
            <li>
              <Link href="/settings/accessibility" className="nav-link">
                <span aria-hidden="true">⚙</span> Хүртээмжийн тохиргоо
              </Link>
            </li>
            <li>
              <Link href="/cart" className="nav-link">
                Сагс
                <span className="badge ml-1">
                  {cart.count}
                  <span className="sr-only"> бараа</span>
                </span>
              </Link>
            </li>
            {user ? (
              <>
                {user.role === "admin" && (
                  <li>
                    <Link href="/admin" className="nav-link">
                      Админ
                    </Link>
                  </li>
                )}
                <li>
                  <Link href="/account" className="nav-link">
                    Миний бүртгэл
                  </Link>
                </li>
              </>
            ) : (
              <li>
                <Link href="/login" className="nav-link">
                  Нэвтрэх
                </Link>
              </li>
            )}
          </ul>
        </nav>
      </div>
      <div className="border-t border-border-soft">
        <nav aria-label="Үндсэн цэс" className="container-page py-1">
          <NavLinks links={[{ href: "/", label: "Нүүр" }, ...MAIN_NAV]} />
        </nav>
      </div>
    </header>
  );
}
