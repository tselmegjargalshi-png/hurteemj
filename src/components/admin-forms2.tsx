"use client";

import {
  moderatePost, resolveSuggestion, saveAssistantConfig, saveListing, savePlace, saveProgram, saveProvider, setBookingStatus, setJobStatus, setReportStatus,
} from "@/app/actions/admin2";
import {
  BOOKING_STATUS_LABELS, FEATURE_VALUE_LABELS, JOB_STATUS_LABELS, MODERATION_LABELS, PLACE_FEATURE_LABELS, PLACE_TYPE_LABELS, SERVICE_CATEGORY_LABELS, VERIFICATION_LABELS,
} from "@/lib/labels";
import { ActionForm, Checkbox, Field, SubmitButton } from "./form";

const opts = (o: Record<string, string>, blank = false) => [...(blank ? [{ value: "", label: "— сонгох —" }] : []), ...Object.entries(o).map(([value, label]) => ({ value, label }))];
const dt = (d?: Date | null) => (d ? new Date(d).toISOString().slice(0, 10) : "");

export function ProviderForm({ p }: { p?: { id: string; name: string; description: string; phone: string | null; email: string | null; address: string | null; verified: boolean; isActive: boolean } }) {
  return (
    <ActionForm action={saveProvider} label={p ? `Үзүүлэгч: ${p.name}` : "Шинэ үйлчилгээ үзүүлэгч"}>
      <input type="hidden" name="id" value={p?.id ?? ""} />
      <Field name="name" label="Нэр" required defaultValue={p?.name} />
      <Field name="description" label="Тайлбар" as="textarea" rows={3} defaultValue={p?.description} />
      <Field name="phone" label="Утас" defaultValue={p?.phone} />
      <Field name="email" label="Имэйл" defaultValue={p?.email} />
      <Field name="address" label="Хаяг" defaultValue={p?.address} />
      <Checkbox name="verified" label="Бичиг баримтыг шалгаж баталгаажуулсан" hint="Шалгаагүй бол тэмдэглэхгүй. Сайт дээр «Баталгаажаагүй» гэж харагдана." defaultChecked={p?.verified} />
      <Checkbox name="isActive" label="Идэвхтэй" defaultChecked={p?.isActive ?? true} />
      <SubmitButton>Хадгалах</SubmitButton>
    </ActionForm>
  );
}

export function ListingForm({ l, providers }: { l?: { id: string; providerId: string; category: string; name: string; description: string; priceMnt: number | null; priceTerms: string; location: string; schedule: string; isActive: boolean }; providers: { id: string; name: string }[] }) {
  return (
    <ActionForm action={saveListing} label={l ? `Үйлчилгээ: ${l.name}` : "Шинэ үйлчилгээ"}>
      <input type="hidden" name="id" value={l?.id ?? ""} />
      <Field name="providerId" as="select" label="Үйлчилгээ үзүүлэгч" required defaultValue={l?.providerId} options={[{ value: "", label: "— сонгох —" }, ...providers.map((p) => ({ value: p.id, label: p.name }))]} />
      <Field name="category" as="select" label="Төрөл" required defaultValue={l?.category} options={opts(SERVICE_CATEGORY_LABELS, true)} />
      <Field name="name" label="Нэр" required defaultValue={l?.name} />
      <Field name="description" label="Тайлбар" as="textarea" rows={3} defaultValue={l?.description} />
      <Field name="priceMnt" label="Үнэ (төгрөг)" type="number" inputMode="numeric" min={0} defaultValue={l?.priceMnt} hint="Тодорхойгүй бол хоосон орхиж, доор үнийн нөхцөл бичнэ." />
      <Field name="priceTerms" label="Үнийн нөхцөл" defaultValue={l?.priceTerms} />
      <Field name="location" label="Байршил" defaultValue={l?.location} />
      <Field name="schedule" label="Цагийн хуваарь" defaultValue={l?.schedule} />
      <Checkbox name="isActive" label="Идэвхтэй" defaultChecked={l?.isActive ?? true} />
      <SubmitButton>Хадгалах</SubmitButton>
    </ActionForm>
  );
}

export function BookingStatusForm({ id, status }: { id: string; status: string }) {
  return (
    <ActionForm action={setBookingStatus}>
      <input type="hidden" name="bookingId" value={id} />
      <div className="flex flex-wrap items-end gap-2"><Field className="" name="status" as="select" label="Төлөв" defaultValue={status} options={opts(BOOKING_STATUS_LABELS)} /><SubmitButton variant="secondary">Хадгалах</SubmitButton></div>
    </ActionForm>
  );
}

type PlaceDefaults = { id?: string; name?: string; type?: string; address?: string; district?: string | null; latitude?: number | null; longitude?: number | null; description?: string; source?: string; verificationStatus?: string; isPublished?: boolean };

export function PlaceForm({ p, features }: { p?: PlaceDefaults; features?: Record<string, string> }) {
  return (
    <ActionForm action={savePlace} label={p?.name ? `Газар: ${p.name}` : "Шинэ газар"}>
      <input type="hidden" name="id" value={p?.id ?? ""} />
      <Field name="name" label="Нэр" required defaultValue={p?.name} />
      <Field name="type" as="select" label="Төрөл" required defaultValue={p?.type} options={opts(PLACE_TYPE_LABELS, true)} />
      <Field name="address" label="Хаяг" required defaultValue={p?.address} />
      <Field name="district" label="Дүүрэг" defaultValue={p?.district} />
      <div className="grid gap-4 sm:grid-cols-2"><Field name="latitude" label="Өргөрөг" inputMode="decimal" defaultValue={p?.latitude} /><Field name="longitude" label="Уртраг" inputMode="decimal" defaultValue={p?.longitude} /></div>
      <Field name="description" label="Тайлбар" as="textarea" rows={3} defaultValue={p?.description} />
      <Field name="source" label="Мэдээллийн эх сурвалж" defaultValue={p?.source} />
      <Field name="verificationStatus" as="select" label="Баталгаажуулалт" defaultValue={p?.verificationStatus ?? "unverified"} options={opts(VERIFICATION_LABELS)} hint="«Баталгаажсан» үед эх сурвалж заавал, баталгаажуулсан огноо автоматаар бичигдэнэ." />
      <fieldset className="card mb-4 p-4"><legend className="px-1 font-bold">Хүртээмж</legend>
        {Object.entries(PLACE_FEATURE_LABELS).map(([k, l]) => <Field key={k} name={`feature_${k}`} as="select" label={l} defaultValue={features?.[k] ?? "unknown"} options={opts(FEATURE_VALUE_LABELS)} />)}
      </fieldset>
      <Checkbox name="isPublished" label="Нийтэд харуулах" defaultChecked={p?.isPublished} />
      <SubmitButton>Хадгалах</SubmitButton>
    </ActionForm>
  );
}

export function SuggestionForm({ id }: { id: string }) {
  return (
    <ActionForm action={resolveSuggestion}>
      <input type="hidden" name="suggestionId" value={id} />
      <div className="flex gap-3"><button type="submit" name="status" value="accepted" className="btn btn-secondary">Хүлээн авсан</button><button type="submit" name="status" value="rejected" className="btn btn-secondary">Татгалзсан</button></div>
    </ActionForm>
  );
}

export function JobStatusForm({ id, status, verified }: { id: string; status: string; verified: boolean }) {
  return (
    <ActionForm action={setJobStatus}>
      <input type="hidden" name="jobId" value={id} />
      <Field name="status" as="select" label="Төлөв" defaultValue={status} options={opts(JOB_STATUS_LABELS)} />
      <Checkbox name="employerVerified" label="Ажил олгогчийн бүртгэлийг шалгаж баталгаажуулсан" defaultChecked={verified} />
      <SubmitButton variant="secondary">Хадгалах</SubmitButton>
    </ActionForm>
  );
}

export function ModerateForm({ kind, id, status }: { kind: "post" | "reply"; id: string; status: string }) {
  return (
    <ActionForm action={moderatePost}>
      <input type="hidden" name="kind" value={kind} /><input type="hidden" name="targetId" value={id} />
      <div className="flex flex-wrap items-end gap-2"><Field className="" name="status" as="select" label="Төлөв" defaultValue={status} options={opts(MODERATION_LABELS)} /><SubmitButton variant="secondary">Хадгалах</SubmitButton></div>
    </ActionForm>
  );
}

export function ReportStatusForm({ id, status }: { id: string; status: string }) {
  return (
    <ActionForm action={setReportStatus}>
      <input type="hidden" name="reportId" value={id} />
      <div className="flex flex-wrap items-end gap-2"><Field className="" name="status" as="select" label="Төлөв" defaultValue={status} options={opts({ new: "Шинэ", reviewing: "Шалгаж байна", resolved: "Шийдвэрлэсэн", dismissed: "Үндэслэлгүй" })} /><SubmitButton variant="secondary">Хадгалах</SubmitButton></div>
    </ActionForm>
  );
}

export function ProgramForm({ p }: { p?: { id: string; title: string; organization: string; description: string; conditions: string; howToApply: string; officialSourceUrl: string; validFrom: Date | null; validTo: Date | null; verificationStatus: string; isPublished: boolean } }) {
  return (
    <ActionForm action={saveProgram} label={p ? `Хөтөлбөр: ${p.title}` : "Шинэ хөтөлбөр"}>
      <input type="hidden" name="id" value={p?.id ?? ""} />
      <Field name="title" label="Гарчиг" required defaultValue={p?.title} />
      <Field name="organization" label="Байгууллага" required defaultValue={p?.organization} />
      <Field name="description" label="Тайлбар" as="textarea" rows={4} required defaultValue={p?.description} />
      <Field name="conditions" label="Нөхцөл" as="textarea" rows={2} defaultValue={p?.conditions} />
      <Field name="howToApply" label="Хүсэлт гаргах заавар" as="textarea" rows={2} defaultValue={p?.howToApply} />
      <Field name="officialSourceUrl" label="Албан ёсны эх сурвалжийн холбоос (https://)" type="url" required defaultValue={p?.officialSourceUrl} />
      <div className="grid gap-4 sm:grid-cols-2"><Field name="validFrom" label="Эхлэх огноо" type="date" defaultValue={dt(p?.validFrom)} /><Field name="validTo" label="Дуусах огноо" type="date" defaultValue={dt(p?.validTo)} /></div>
      <Field name="verificationStatus" as="select" label="Баталгаажуулалт" defaultValue={p?.verificationStatus ?? "unverified"} options={opts(VERIFICATION_LABELS)} />
      <Checkbox name="isPublished" label="Нийтэд харуулах" defaultChecked={p?.isPublished} />
      <SubmitButton>Хадгалах</SubmitButton>
    </ActionForm>
  );
}

export function AssistantConfigForm({ enabled, extra, keyPresent }: { enabled: boolean; extra: string; keyPresent: boolean }) {
  return (
    <ActionForm action={saveAssistantConfig} label="AI туслахын тохиргоо">
      <p className={`notice mb-4 ${keyPresent ? "notice-info" : "notice-warning"}`}>{keyPresent ? "ANTHROPIC_API_KEY тохируулагдсан. (Бодит дуудлагыг энэ хувилбарт туршаагүй.)" : "ANTHROPIC_API_KEY тохируулаагүй тул AI холбогдоогүй; туслах зөвхөн энгийн хайлт хийнэ."}</p>
      <Checkbox name="enabled" label="AI туслахыг идэвхжүүлэх" defaultChecked={enabled} />
      <Field name="extraInstructions" label="Нэмэлт заавар" as="textarea" rows={4} defaultValue={extra} hint="Аюулгүй байдлын үндсэн дүрэм (оношлохгүй, зохиомол мэдээлэл өгөхгүй) үргэлж үйлчилнэ." />
      <SubmitButton>Хадгалах</SubmitButton>
    </ActionForm>
  );
}
