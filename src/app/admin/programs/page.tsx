import { desc } from "drizzle-orm";
import { db } from "@/db";
import { supportPrograms } from "@/db/schema";
import { ProgramForm } from "@/components/admin-forms2";

export const metadata = { title: "Админ: дэмжлэгийн хөтөлбөр" };

export default async function AdminPrograms() {
  const rows = await db.select().from(supportPrograms).orderBy(desc(supportPrograms.createdAt));
  return (
    <div>
      <h1 className="text-3xl font-bold">Дэмжлэгийн хөтөлбөр</h1>
      <p className="mt-2">Зөвхөн албан ёсны эх сурвалжтай хөтөлбөрийг нэмнэ. Зохиомол хөнгөлөлт оруулахгүй.</p>
      {rows.map((p) => <details key={p.id} className="card mt-3 p-4"><summary className="cursor-pointer font-bold">{p.title} — {p.isPublished ? "нийтлэгдсэн" : "нийтлээгүй"}</summary><div className="mt-4"><ProgramForm p={p} /></div></details>)}
      <details className="card mt-3 p-4"><summary className="cursor-pointer font-bold">Шинэ хөтөлбөр нэмэх</summary><div className="mt-4"><ProgramForm /></div></details>
    </div>
  );
}
