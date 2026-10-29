import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { serviceBookings, serviceListings, serviceProviders } from "@/db/schema";
import { CancelBookingForm } from "@/components/booking-forms";
import { requireUser } from "@/lib/auth";
import { formatDateTime } from "@/lib/format";
import { BOOKING_STATUS_LABELS, CONTACT_PREFERENCE_LABELS } from "@/lib/labels";

export const metadata = { title: "Миний үйлчилгээний захиалга" };

export default async function MyBookings() {
  const user = await requireUser("/services/bookings");
  const rows = await db
    .select({ b: serviceBookings, name: serviceListings.name, provider: serviceProviders.name })
    .from(serviceBookings)
    .innerJoin(serviceListings, eq(serviceListings.id, serviceBookings.listingId))
    .innerJoin(serviceProviders, eq(serviceProviders.id, serviceListings.providerId))
    .where(eq(serviceBookings.userId, user.id))
    .orderBy(desc(serviceBookings.createdAt));
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-3xl font-bold">Миний үйлчилгээний захиалга</h1>
      {rows.length === 0 ? <p className="notice notice-info mt-6">Захиалга алга.</p> : (
        <ul className="mt-6 space-y-3" role="list">
          {rows.map(({ b, name, provider }) => (
            <li key={b.id} className="card p-4">
              <h2 className="text-lg font-bold">{name}</h2>
              <p>Үзүүлэгч: {provider}</p>
              <p>Хүссэн цаг: {formatDateTime(b.requestedAt)} · Төлөв: <strong>{BOOKING_STATUS_LABELS[b.status]}</strong></p>
              <p className="text-sm text-muted">Холбогдох хэлбэр: {CONTACT_PREFERENCE_LABELS[b.contactPreference]}</p>
              {b.status === "requested" && <div className="mt-2"><CancelBookingForm bookingId={b.id} name={name} /></div>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
