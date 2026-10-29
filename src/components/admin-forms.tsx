"use client";

import {
  adminChangeOrderStatus, adminReplySupport, adminSetPayment, adminUpdateUser,
  deleteProductImage, saveCategory, saveDeliveryMethod, saveProduct, saveSiteSettings,
} from "@/app/actions/admin";
import { ORDER_STATUS_LABELS, PAYMENT_STATUS_LABELS, ROLE_LABELS, SUPPORT_STATUS_LABELS } from "@/lib/labels";
import { ActionForm, Checkbox, Field, SubmitButton } from "./form";

export type ProductDefaults = {
  id?: string; name?: string; categoryId?: number; summary?: string; description?: string; usage?: string; specifications?: string;
  suitableFor?: string; cautions?: string; priceMnt?: number; priceVerified?: boolean; stock?: number; deliveryInfo?: string; warrantyInfo?: string;
  returnPolicy?: string; supplierName?: string; sourceNote?: string; condition?: string; status?: string; isFeatured?: boolean;
};

export function ProductForm({ d, cats }: { d: ProductDefaults; cats: { id: number; name: string }[] }) {
  return (
    <ActionForm action={saveProduct} label="Бүтээгдэхүүн">
      <input type="hidden" name="id" value={d.id ?? ""} />
      <Field name="name" label="Нэр (Монголоор)" required defaultValue={d.name} />
      <Field name="categoryId" as="select" label="Ангилал" required defaultValue={d.categoryId} options={[{ value: "", label: "— сонгох —" }, ...cats.map((c) => ({ value: String(c.id), label: c.name }))]} />
      <Field name="summary" label="Товч тайлбар" as="textarea" rows={2} defaultValue={d.summary} />
      <Field name="description" label="Дэлгэрэнгүй тайлбар" as="textarea" rows={6} defaultValue={d.description} />
      <Field name="usage" label="Хэрэглээ" as="textarea" rows={3} defaultValue={d.usage} />
      <Field name="specifications" label="Хэмжээ, материал, техникийн үзүүлэлт" as="textarea" rows={5} defaultValue={d.specifications} hint="Мөр бүрд «Нэр: утга» хэлбэрээр. Жишээ: Жин: 12 кг" />
      <Field name="suitableFor" label="Хэнд тохиромжтой" as="textarea" rows={2} defaultValue={d.suitableFor} />
      <Field name="cautions" label="Хэрэглэхэд анхаарах зүйл" as="textarea" rows={3} defaultValue={d.cautions} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field name="priceMnt" label="Үнэ (төгрөг)" type="number" inputMode="numeric" min={0} required defaultValue={d.priceMnt ?? 0} />
        <Field name="stock" label="Нөөцийн тоо" type="number" inputMode="numeric" min={0} required defaultValue={d.stock ?? 0} />
      </div>
      <Checkbox name="priceVerified" label="Үнийг нийлүүлэгчтэй баталгаажуулсан" hint="Тэмдэглээгүй бол сайт дээр «Үнэ баталгаажаагүй» гэж харагдана." defaultChecked={d.priceVerified} />
      <Field name="supplierName" label="Нийлүүлэгч" defaultValue={d.supplierName} />
      <Field name="sourceNote" label="Мэдээллийн эх сурвалж" defaultValue={d.sourceNote} hint="Үйлдвэрлэгчийн сайт, каталог гэх мэт." />
      <Field name="deliveryInfo" label="Хүргэлтийн нөхцөл" as="textarea" rows={2} defaultValue={d.deliveryInfo} />
      <Field name="warrantyInfo" label="Баталгааны нөхцөл" as="textarea" rows={2} defaultValue={d.warrantyInfo} />
      <Field name="returnPolicy" label="Буцаалтын нөхцөл" as="textarea" rows={2} defaultValue={d.returnPolicy} />
      <Field name="condition" as="select" label="Төлөв" defaultValue={d.condition ?? "new"} options={[{ value: "new", label: "Шинэ" }, { value: "used_inspected", label: "Шалгагдсан хуучин" }]} />
      <Field name="status" as="select" label="Нийтлэлийн төлөв" defaultValue={d.status ?? "draft"} options={[{ value: "draft", label: "Ноорог (сайтад харагдахгүй)" }, { value: "published", label: "Нийтлэх" }, { value: "archived", label: "Архивлах" }]} />
      <Checkbox name="isFeatured" label="Нүүр хуудсанд онцлох" defaultChecked={d.isFeatured} />
      <fieldset className="card mb-6 p-4">
        <legend className="px-1 text-lg font-bold">Зураг нэмэх (заавал биш)</legend>
        <p className="mb-3 text-muted">Зөвхөн бодит бүтээгдэхүүний зураг, ашиглах эрхтэй эх сурвалж. Файл байршуулах үйлчилгээ холбогдоогүй тул https холбоос оруулна.</p>
        <Field name="imageUrl" label="Зургийн холбоос (https://)" type="url" inputMode="url" />
        <Field name="imageAlt" label="Зургийн тайлбар (alt)" hint="Харааны бэрхшээлтэй хэрэглэгчид уншигдана. Бүтээгдэхүүний нэр, өнгө, хэлбэр, зориулалтыг бич." />
        <Field name="imageCredit" label="Зургийн эх сурвалж / зохиогчийн эрх" />
        <Checkbox name="imageAi" label="Энэ зургийг AI-аар бүтээсэн" hint="Тэмдэглэвэл сайт дээр бодит зураг биш гэж тэмдэглэгдэнэ." />
      </fieldset>
      <SubmitButton pendingText="Хадгалж байна…">Хадгалах</SubmitButton>
    </ActionForm>
  );
}

export function DeleteImageForm({ imageId, alt }: { imageId: number; alt: string }) {
  return (
    <ActionForm action={deleteProductImage}>
      <input type="hidden" name="imageId" value={imageId} />
      <SubmitButton variant="danger" pendingText="Устгаж байна…">Зураг устгах<span className="sr-only"> {alt}</span></SubmitButton>
    </ActionForm>
  );
}

export function CategoryForm({ c }: { c?: { id: number; name: string; description: string; sortOrder: number } }) {
  return (
    <ActionForm action={saveCategory} label={c ? `Ангилал: ${c.name}` : "Шинэ ангилал"}>
      <input type="hidden" name="id" value={c?.id ?? ""} />
      <Field name="name" label="Нэр" required defaultValue={c?.name} />
      <Field name="description" label="Тайлбар" defaultValue={c?.description} />
      <Field name="sortOrder" label="Дараалал" type="number" inputMode="numeric" defaultValue={c?.sortOrder ?? 0} />
      <SubmitButton>Хадгалах</SubmitButton>
    </ActionForm>
  );
}

export function OrderStatusForm({ orderId, allowed }: { orderId: string; allowed: (keyof typeof ORDER_STATUS_LABELS)[] }) {
  // Эцсийн төлөвт хүрсэн ч маягт байрандаа үлдэж, амжилтын мэдэгдэл дэлгэц уншигчид зарлагдсаар байна.
  return (
    <ActionForm action={adminChangeOrderStatus} label="Захиалгын төлөв өөрчлөх">
      {allowed.length === 0 ? (
        <p>Энэ захиалгын төлөвийг цаашид өөрчлөх боломжгүй.</p>
      ) : (
        <>
          <input type="hidden" name="orderId" value={orderId} />
          <Field name="status" as="select" label="Шинэ төлөв" required options={allowed.map((k) => ({ value: k, label: ORDER_STATUS_LABELS[k] }))} />
          <Field name="note" label="Хэрэглэгчид харагдах тэмдэглэл" />
          <Field name="trackingInfo" label="Хүргэлтийн мэдээлэл (жолоочийн утас, дугаар гэх мэт)" />
          <SubmitButton>Төлөв шинэчлэх</SubmitButton>
        </>
      )}
    </ActionForm>
  );
}

export function PaymentForm({ orderId, current }: { orderId: string; current: keyof typeof PAYMENT_STATUS_LABELS }) {
  return (
    <ActionForm action={adminSetPayment} label="Төлбөрийн төлөв">
      <input type="hidden" name="orderId" value={orderId} />
      <Field name="status" as="select" label="Төлбөрийн төлөв (гараар баталгаажуулна)" defaultValue={current} options={(["pending", "paid", "failed", "refunded"] as const).map((k) => ({ value: k, label: PAYMENT_STATUS_LABELS[k] }))} />
      <SubmitButton>Хадгалах</SubmitButton>
    </ActionForm>
  );
}

export function SupportAdminForm({ requestId, status }: { requestId: string; status: keyof typeof SUPPORT_STATUS_LABELS }) {
  return (
    <ActionForm action={adminReplySupport} label="Хариу бичих" resetOnSuccess>
      <input type="hidden" name="requestId" value={requestId} />
      <Field name="body" label="Хариу" as="textarea" rows={4} />
      <Field name="status" as="select" label="Төлөв" defaultValue={status} options={Object.entries(SUPPORT_STATUS_LABELS).map(([value, label]) => ({ value, label }))} />
      <SubmitButton>Хадгалах</SubmitButton>
    </ActionForm>
  );
}

export function DeliveryForm({ m }: { m?: { id: number; name: string; description: string; feeMnt: number; estimatedTime: string; requiresAddress: boolean; isActive: boolean } }) {
  return (
    <ActionForm action={saveDeliveryMethod} label={m ? `Хүргэлт: ${m.name}` : "Шинэ хүргэлтийн төрөл"}>
      <input type="hidden" name="id" value={m?.id ?? ""} />
      <Field name="name" label="Нэр" required defaultValue={m?.name} />
      <Field name="description" label="Тайлбар" defaultValue={m?.description} />
      <Field name="feeMnt" label="Хүргэлтийн төлбөр (төгрөг)" type="number" inputMode="numeric" min={0} required defaultValue={m?.feeMnt ?? 0} />
      <Field name="estimatedTime" label="Хугацаа" defaultValue={m?.estimatedTime} />
      <Checkbox name="requiresAddress" label="Хаяг шаардлагатай" defaultChecked={m?.requiresAddress ?? true} />
      <Checkbox name="isActive" label="Идэвхтэй" defaultChecked={m?.isActive ?? true} />
      <SubmitButton>Хадгалах</SubmitButton>
    </ActionForm>
  );
}

export function SettingsForm({ bank, announcement }: { bank: { bankName: string; accountName: string; accountNumber: string; note: string } | null; announcement: string }) {
  return (
    <ActionForm action={saveSiteSettings} label="Сайтын тохиргоо">
      <h2 className="mb-2 text-xl font-bold">Дансаар шилжүүлэх мэдээлэл</h2>
      <Field name="bankName" label="Банк" defaultValue={bank?.bankName} />
      <Field name="accountName" label="Данс эзэмшигч" defaultValue={bank?.accountName} />
      <Field name="accountNumber" label="Дансны дугаар" defaultValue={bank?.accountNumber} />
      <Field name="bankNote" label="Гүйлгээний утга зэрэг тэмдэглэл" defaultValue={bank?.note} />
      <h2 className="mb-2 mt-6 text-xl font-bold">Нүүр хуудасны мэдэгдэл</h2>
      <Field name="announcement" label="Мэдэгдэл (хоосон бол харагдахгүй)" defaultValue={announcement} />
      <SubmitButton>Хадгалах</SubmitButton>
    </ActionForm>
  );
}

export function UserForm({ u }: { u: { id: string; name: string; role: keyof typeof ROLE_LABELS; status: "active" | "blocked" } }) {
  return (
    <ActionForm action={adminUpdateUser} label={`Хэрэглэгч: ${u.name}`}>
      <input type="hidden" name="userId" value={u.id} />
      <div className="flex flex-wrap items-end gap-3">
        <Field className="" name="role" as="select" label="Эрх" defaultValue={u.role} options={Object.entries(ROLE_LABELS).map(([value, label]) => ({ value, label }))} />
        <Field className="" name="status" as="select" label="Төлөв" defaultValue={u.status} options={[{ value: "active", label: "Идэвхтэй" }, { value: "blocked", label: "Блоклосон" }]} />
        <SubmitButton variant="secondary">Хадгалах<span className="sr-only"> {u.name}</span></SubmitButton>
      </div>
    </ActionForm>
  );
}
