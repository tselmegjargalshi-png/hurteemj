import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-16 border-t border-border-soft bg-surface">
      <div className="container-page grid gap-8 py-10 md:grid-cols-3">
        <section aria-labelledby="footer-shop">
          <h2 id="footer-shop" className="mb-2 font-bold">
            Худалдан авалт
          </h2>
          <ul className="space-y-1">
            <li><Link href="/info/delivery" className="nav-link px-0">Хүргэлтийн нөхцөл</Link></li>
            <li><Link href="/info/payment" className="nav-link px-0">Төлбөрийн нөхцөл</Link></li>
            <li><Link href="/info/returns" className="nav-link px-0">Буцаалт, баталгаа</Link></li>
            <li><Link href="/orders" className="nav-link px-0">Миний захиалгууд</Link></li>
          </ul>
        </section>
        <section aria-labelledby="footer-help">
          <h2 id="footer-help" className="mb-2 font-bold">
            Тусламж
          </h2>
          <ul className="space-y-1">
            <li><Link href="/help" className="nav-link px-0">Бичгээр тусламж хүсэх</Link></li>
            <li><Link href="/communication" className="nav-link px-0">Харилцааны дэмжлэг</Link></li>
            <li><Link href="/support-programs" className="nav-link px-0">Дэмжлэгийн хөтөлбөр</Link></li>
            <li><Link href="/settings/accessibility" className="nav-link px-0">Хүртээмжийн тохиргоо</Link></li>
            <li><Link href="/accessibility" className="nav-link px-0">Хүртээмжийн мэдэгдэл</Link></li>
          </ul>
        </section>
        <section aria-labelledby="footer-about">
          <h2 id="footer-about" className="mb-2 font-bold">
            Платформ
          </h2>
          <ul className="space-y-1">
            <li><Link href="/status" className="nav-link px-0">Платформын төлөв: юу ажиллаж байна</Link></li>
            <li><Link href="/privacy" className="nav-link px-0">Хувийн мэдээллийн бодлого</Link></li>
          </ul>
        </section>
      </div>
      <p className="container-page pb-8 text-sm text-muted">
        Хүртээмж — хөгжлийн бэрхшээлтэй хүмүүст зориулсан хүртээмжтэй платформ. Туршилтын хувилбар.
      </p>
    </footer>
  );
}
