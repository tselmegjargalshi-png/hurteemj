"use client";

import { createSupportRequest, replySupport } from "@/app/actions/support";
import { CONTACT_PREFERENCE_LABELS, SUPPORT_TYPE_LABELS } from "@/lib/labels";
import { ActionForm, Checkbox, Field, SubmitButton } from "./form";

export function SupportRequestForm({ defaultName, loggedIn, defaultType }: { defaultName: string; loggedIn: boolean; defaultType?: string }) {
  const prefOptions = Object.entries(CONTACT_PREFERENCE_LABELS)
    .filter(([k]) => loggedIn || k !== "in_app")
    .map(([value, label]) => ({ value, label }));
  return (
    <ActionForm action={createSupportRequest} label="Тусламжийн хүсэлт">
      <p className="mb-4 text-muted"><span aria-hidden="true">*</span> тэмдэгтэй талбарыг заавал бөглөнө.</p>
      <Field name="type" as="select" label="Ямар тусламж хэрэгтэй вэ?" required defaultValue={defaultType} options={Object.entries(SUPPORT_TYPE_LABELS).map(([value, label]) => ({ value, label }))} />
      <Field name="subject" label="Гарчиг" required />
      <Field name="message" label="Хүсэлтийн тайлбар" as="textarea" required hint="Юу хэрэгтэй байгааг өөрийнхөөрөө бичнэ үү. Эрүүл мэндийн нарийн мэдээлэл бичих шаардлагагүй." />
      <Field name="contactName" label="Нэр" required defaultValue={defaultName} autoComplete="name" />
      <Field name="contactPreference" as="select" label="Танд хэрхэн хариу өгөх вэ?" required options={prefOptions} hint="Бичгээр харилцахыг сонговол дуудлага хийхгүй." />
      <Field name="contactValue" label="Холбоо барих имэйл эсвэл утас" hint="Сайт доторх мэдэгдлээр хариу авах бол хоосон орхиж болно." autoComplete="email" />
      <Checkbox name="shareConsent" label="Миний бичсэн мэдээлэл, холбоо барих хаягийг тусламж үзүүлэх ажилтанд харуулахыг зөвшөөрч байна" />
      <SubmitButton pendingText="Илгээж байна…">Хүсэлт илгээх</SubmitButton>
    </ActionForm>
  );
}

export function ReplyForm({ requestId }: { requestId: string }) {
  return (
    <ActionForm action={replySupport} label="Мессеж бичих" resetOnSuccess>
      <input type="hidden" name="requestId" value={requestId} />
      <Field name="body" label="Таны мессеж" as="textarea" rows={4} required />
      <SubmitButton pendingText="Илгээж байна…">Мессеж илгээх</SubmitButton>
    </ActionForm>
  );
}
