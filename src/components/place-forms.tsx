"use client";

import { suggestPlace, suggestPlaceEdit } from "@/app/actions/places";
import { FEATURE_VALUE_LABELS, PLACE_FEATURE_LABELS, PLACE_TYPE_LABELS } from "@/lib/labels";
import { ActionForm, Field, SubmitButton } from "./form";

export function SuggestPlaceForm() {
  return (
    <ActionForm action={suggestPlace} label="Газар нэмэх">
      <Field name="name" label="Газрын нэр" required />
      <Field name="type" as="select" label="Төрөл" required options={[{ value: "", label: "— сонгох —" }, ...Object.entries(PLACE_TYPE_LABELS).map(([value, label]) => ({ value, label }))]} />
      <Field name="address" label="Хаяг" required />
      <Field name="district" label="Дүүрэг" />
      <Field name="description" label="Тайлбар" as="textarea" rows={3} />
      <Field name="source" label="Мэдээллийн эх сурвалж" hint="Жишээ нь: би биечлэн очсон, вэбсайт." />
      <fieldset className="card mb-6 p-4">
        <legend className="px-1 text-lg font-bold">Хүртээмжийн мэдээлэл</legend>
        <p className="mb-3 text-muted">Мэдэхгүй бол «Мэдэгдэхгүй» хэвээр үлдээнэ үү.</p>
        {Object.entries(PLACE_FEATURE_LABELS).map(([k, label]) => (
          <Field key={k} name={`feature_${k}`} as="select" label={label} defaultValue="unknown" options={Object.entries(FEATURE_VALUE_LABELS).map(([value, l]) => ({ value, label: l }))} />
        ))}
      </fieldset>
      <p className="notice notice-info mb-4">Таны илгээсэн газар администратор шалгаж баталгаажуулах хүртэл нийтэд харагдахгүй.</p>
      <SubmitButton pendingText="Илгээж байна…">Илгээх</SubmitButton>
    </ActionForm>
  );
}

export function PlaceEditForm({ placeId }: { placeId: string }) {
  return (
    <ActionForm action={suggestPlaceEdit} label="Засвар санал болгох" resetOnSuccess>
      <input type="hidden" name="placeId" value={placeId} />
      <Field name="body" label="Юуг засах, нэмэх вэ?" as="textarea" rows={4} required />
      <SubmitButton pendingText="Илгээж байна…">Санал илгээх</SubmitButton>
    </ActionForm>
  );
}
