"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function NavLinks({ links }: { links: { href: string; label: string }[] }) {
  const pathname = usePathname();
  return (
    <ul className="flex flex-wrap gap-1">
      {links.map((l) => {
        const active = l.href === "/" ? pathname === "/" : pathname === l.href || pathname.startsWith(`${l.href}/`);
        return (
          <li key={l.href}>
            <Link href={l.href} className="nav-link" aria-current={active ? "page" : undefined}>
              {l.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
