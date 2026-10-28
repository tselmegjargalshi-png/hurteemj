"use client";

import { login, register } from "@/app/actions/auth";
import { ActionForm, Checkbox, Field, SubmitButton } from "./form";

export function LoginForm({ next }: { next: string }) {
  return (
    <ActionForm action={login} label="Нэвтрэх">
      <input type="hidden" name="next" value={next} />
      <Field name="email" label="Имэйл хаяг" type="email" autoComplete="email" inputMode="email" required />
      <Field name="password" label="Нууц үг" type="password" autoComplete="current-password" required />
      <SubmitButton pendingText="Нэвтэрч байна…">Нэвтрэх</SubmitButton>
    </ActionForm>
  );
}

export function RegisterForm({ next }: { next: string }) {
  return (
    <ActionForm action={register} label="Бүртгүүлэх">
      <input type="hidden" name="next" value={next} />
      <p className="mb-4 text-muted"><span aria-hidden="true">*</span> тэмдэгтэй талбарыг заавал бөглөнө.</p>
      <Field name="name" label="Нэр" autoComplete="name" required />
      <Field name="email" label="Имэйл хаяг" type="email" autoComplete="email" inputMode="email" required hint="Нэвтрэхэд ашиглана." />
      <Field name="phone" label="Утасны дугаар" type="tel" autoComplete="tel" inputMode="tel" hint="8 оронтой. Захиалгын үед хэрэгтэй." />
      <Field name="password" label="Нууц үг" type="password" autoComplete="new-password" required hint="Дор хаяж 10 тэмдэгт. Урт өгүүлбэр ч болно." />
      <Field name="passwordConfirm" label="Нууц үг давтах" type="password" autoComplete="new-password" required />
      <Checkbox
        name="terms"
        label="Үйлчилгээний нөхцөл болон хувийн мэдээллийн бодлогыг зөвшөөрч байна"
        hint="Бид хөгжлийн бэрхшээлийн төрөл, эрүүл мэндийн мэдээлэл асуухгүй, цуглуулахгүй."
      />
      <SubmitButton pendingText="Бүртгэж байна…">Бүртгүүлэх</SubmitButton>
    </ActionForm>
  );
}
