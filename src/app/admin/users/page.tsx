import { desc } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { UserForm } from "@/components/admin-forms";
import { formatDate } from "@/lib/format";

export const metadata = { title: "Админ: хэрэглэгч" };

export default async function AdminUsers() {
  const rows = await db.select({ id: users.id, name: users.name, email: users.email, role: users.role, status: users.status, createdAt: users.createdAt }).from(users).orderBy(desc(users.createdAt)).limit(200);
  return (
    <div>
      <h1 className="text-3xl font-bold">Хэрэглэгч</h1>
      <ul className="mt-6 space-y-3" role="list">
        {rows.map((u) => (
          <li key={u.id} className="card p-4"><p className="font-bold">{u.name} · <span className="font-normal">{u.email}</span> · {formatDate(u.createdAt)}</p><UserForm u={u} /></li>
        ))}
      </ul>
    </div>
  );
}
