import Link from "next/link";
import { requireAdmin } from "@/lib/auth";

const LINKS = [
  ["/admin", "Хяналтын самбар"],
  ["/admin/products", "Бүтээгдэхүүн"],
  ["/admin/categories", "Ангилал"],
  ["/admin/orders", "Захиалга"],
  ["/admin/delivery", "Хүргэлтийн төрөл"],
  ["/admin/support", "Тусламжийн хүсэлт"],
  ["/admin/services", "Үйлчилгээ"],
  ["/admin/bookings", "Цаг авалт"],
  ["/admin/places", "Газар"],
  ["/admin/jobs", "Ажлын зар"],
  ["/admin/community", "Нийгэмлэг"],
  ["/admin/programs", "Хөтөлбөр"],
  ["/admin/assistant", "AI туслах"],
  ["/admin/users", "Хэрэглэгч"],
  ["/admin/settings", "Тохиргоо"],
] as const;

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin(); // Сервер талын эрхийн шалгалт
  return (
    <div>
      <nav aria-label="Админ цэс" className="mb-6 border-b border-border-soft pb-3">
        <ul className="flex flex-wrap gap-1">
          {LINKS.map(([href, label]) => (
            <li key={href}><Link href={href} className="nav-link">{label}</Link></li>
          ))}
        </ul>
      </nav>
      {children}
    </div>
  );
}
