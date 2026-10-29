"use client";

import { bookService, cancelBooking } from "@/app/actions/services";
import { CONTACT_PREFERENCE_LABELS } from "@/lib/labels";
import { ActionForm, Field, SubmitButton } from "./form";

export function BookingForm({ listingId }: { listingId: string }) {
  return (
    <ActionForm action={bookService} label="Үйлчилгээ захиалах">
      <input type="hidden" name="listingId" value={listingId} />
      <Field name="requestedAt" label="Хүссэн огноо, цаг" type="datetime-local" required hint="Үйлчилгээ үзүүлэгч баталгаажуулах хүртэл энэ нь зөвхөн хүсэлт." />
      <Field name="contactPreference" as="select" label="Танд хэрхэн хариу өгөх вэ?" required options={Object.entries(CONTACT_PREFERENCE_LABELS).map(([value, label]) => ({ value, label }))} />
      <Field name="note" label="Нэмэлт тэмдэглэл" as="textarea" rows={3} hint="Жишээ нь: хаалганы код, тэргэнцэрийн төрөл." />
      <SubmitButton pendingText="Илгээж байна…">Хүсэлт илгээх</SubmitButton>
    </ActionForm>
  );
}

export function CancelBookingForm({ bookingId, name }: { bookingId: string; name: string }) {
  return (
    <ActionForm action={cancelBooking}>
      <input type="hidden" name="bookingId" value={bookingId} />
      <SubmitButton variant="danger" pendingText="Цуцалж байна…">Цуцлах<span className="sr-only"> {name}</span></SubmitButton>
    </ActionForm>
  );
}
