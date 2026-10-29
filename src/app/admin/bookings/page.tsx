import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { serviceBookings, serviceListings, users } from "@/db/schema";
import { BookingStatusForm } from "@/components/admin-forms2";
import { formatDateTime } from "@/lib/format";

export const metadata = { title: "Админ: захиалгат цаг" };

export default async function AdminBookings() {
  const rows = await db
    .select({ b: serviceBookings, listing: serviceListings.name, user: users.name, email: users.email })
    .from(serviceBookings)
    .innerJoin(serviceListings, eq(serviceListings.id, serviceBookings.listingId))
    .innerJoin(users, eq(users.id, serviceBookings.userId))
    .orderBy(desc(serviceBookings.createdAt))
    .limit(200);
  return (
    <div>
      <h1 className="text-3xl font-bold">Үйлчилгээний цаг авалт</h1>
      {rows.length === 0 ? <p className="notice notice-info mt-6">Цаг авалт алга.</p> : (
        <ul className="mt-6 space-y-3">
          {rows.map(({ b, listing, user, email }) => (
            <li key={b.id} className="card p-4">
              <p className="font-bold">{listing}</p>
              <p>{user} ({email}) — {formatDateTime(b.requestedAt)}</p>
              {b.note && <p>Тэмдэглэл: {b.note}</p>}
              <BookingStatusForm id={b.id} status={b.status} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
