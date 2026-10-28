"use client";

import { useState } from "react";
import { placeOrder } from "@/app/actions/checkout";
import { formatMnt } from "@/lib/format";
import { CONTACT_PREFERENCE_LABELS } from "@/lib/labels";
import { ActionForm, Checkbox, Field, RadioGroup, SubmitButton } from "./form";

type Method = { id: number; name: string; description: string; feeMnt: number; estimatedTime: string; requiresAddress: boolean };

export function CheckoutForm({
  methods,
  defaults,
  bankInfo,
}: {
  methods: Method[];
  defaults: { name: string; phone: string; email: string };
  bankInfo: { bankName: string; accountName: string; accountNumber: string; note: string } | null;
}) {
  const [methodId, setMethodId] = useState<number | null>(methods[0]?.id ?? null);
  const method = methods.find((m) => m.id === methodId);
  const [pay, setPay] = useState("cash_on_delivery");
  return (
    <ActionForm action={placeOrder} label="Захиалгын мэдээлэл">
      <p className="mb-4 text-muted"><span aria-hidden="true">*</span> тэмдэгтэй талбарыг заавал бөглөнө.</p>

      <fieldset className="card mb-6 p-5">
        <legend className="px-1 text-xl font-bold">1. Холбоо барих мэдээлэл</legend>
        <Field name="contactName" label="Нэр" autoComplete="name" required defaultValue={defaults.name} />
        <Field name="contactPhone" label="Утасны дугаар" type="tel" inputMode="tel" autoComplete="tel" required defaultValue={defaults.phone} hint="8 оронтой" />
        <Field name="contactEmail" label="Имэйл" type="email" autoComplete="email" defaultValue={defaults.email} />
        <Field
          name="contactPreference"
          as="select"
          label="Захиалгын талаар танд хэрхэн холбогдох вэ?"
          required
          hint="Дуудлага шаардлагагүй. Сонсголгүй хэрэглэгчид «Зөвхөн сайт дээрх бичгэн мэдэгдэл»-ийг сонгоорой."
          options={Object.entries(CONTACT_PREFERENCE_LABELS).map(([value, label]) => ({ value, label }))}
        />
      </fieldset>

      <div className="card mb-6 p-5">
        <h2 className="mb-3 text-xl font-bold">2. Хүргэлт</h2>
        {methods.length === 0 ? (
          <p className="notice notice-warning">Хүргэлтийн төрөл одоогоор тохируулаагүй байна. Тусламж хэсгээр холбогдоно уу.</p>
        ) : (
          <div onChange={(e) => {
            const t = e.target as HTMLInputElement;
            if (t.name === "deliveryMethodId") setMethodId(Number(t.value));
          }}>
            <RadioGroup
              name="deliveryMethodId"
              legend="Хүргэлтийн төрөл"
              required
              defaultValue={String(methods[0].id)}
              options={methods.map((m) => ({
                value: String(m.id),
                label: `${m.name} — ${m.feeMnt === 0 ? "үнэгүй" : formatMnt(m.feeMnt)}`,
                description: [m.description, m.estimatedTime && `Хугацаа: ${m.estimatedTime}`].filter(Boolean).join(". "),
              }))}
            />
          </div>
        )}
        {method?.requiresAddress && (
          <div>
            <h3 className="mb-2 text-lg font-bold">Хүргэлтийн хаяг</h3>
            <Field name="city" label="Хот / аймаг" defaultValue="Улаанбаатар" autoComplete="address-level1" />
            <Field name="district" label="Дүүрэг / сум" autoComplete="address-level2" />
            <Field name="khoroo" label="Хороо" />
            <Field name="addressLine" label="Дэлгэрэнгүй хаяг" as="textarea" rows={3} required autoComplete="street-address" hint="Байр, орц, давхар, тоот, ойролцоох тэмдэглэгээ." />
            <Field name="addressNote" label="Хүргэлтийн тэмдэглэл" as="textarea" rows={2} hint="Жишээ нь: лифттэй, налуу замтай, хаалганы код." />
          </div>
        )}
      </div>

      <div className="card mb-6 p-5" onChange={(e) => {
        const t = e.target as HTMLInputElement;
        if (t.name === "paymentMethod") setPay(t.value);
      }}>
        <h2 className="mb-3 text-xl font-bold">3. Төлбөр</h2>
        <p className="notice notice-warning mb-4">
          Онлайн төлбөр (QPay, карт) одоогоор холбогдоогүй. Захиалга «Төлөгдөөгүй» төлөвтэй бүртгэгдэнэ. Төлбөрийг доорх хэлбэрээр хийж, манай ажилтан бичгээр баталгаажуулна.
        </p>
        <RadioGroup
          name="paymentMethod"
          legend="Төлбөрийн хэлбэр"
          required
          defaultValue="cash_on_delivery"
          options={[
            { value: "cash_on_delivery", label: "Хүлээн авахдаа төлөх", description: "Бараагаа хүлээн авахдаа бэлнээр төлнө." },
            { value: "bank_transfer", label: "Дансаар шилжүүлэх", description: "Захиалга бүртгэгдсэний дараа заасан данс руу шилжүүлнэ." },
          ]}
        />
        {pay === "bank_transfer" && (
          <div className="notice notice-info">
            {bankInfo ? (
              <p>Банк: {bankInfo.bankName}. Данс эзэмшигч: {bankInfo.accountName}. Дансны дугаар: {bankInfo.accountNumber}. {bankInfo.note}</p>
            ) : (
              <p>Дансны мэдээллийг дэлгүүр одоогоор тохируулаагүй байна. Захиалгын дараа манай ажилтан дансны мэдээллийг бичгээр илгээнэ.</p>
            )}
          </div>
        )}
      </div>

      <div className="card mb-6 p-5">
        <h2 className="mb-3 text-xl font-bold">4. Нэмэлт тэмдэглэл ба баталгаажуулалт</h2>
        <Field name="customerNote" label="Худалдагчид хэлэх зүйл" as="textarea" rows={3} />
        <Checkbox name="confirm" label="Захиалгын мэдээллээ шалгасан, захиалга өгөхийг зөвшөөрч байна" hint="Товчийг дарсны дараа захиалга бүртгэгдэнэ. Захиалгыг баталгаажуулахаас өмнө сайтаас цуцалж болно." />
      </div>
      <SubmitButton pendingText="Захиалга бүртгэж байна…">Захиалга баталгаажуулах</SubmitButton>
    </ActionForm>
  );
}
