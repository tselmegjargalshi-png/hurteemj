"use client";

import { inviteCaregiver, respondInvite, revokeCaregiver, updateCaregiverPermissions } from "@/app/actions/caregiver";
import { ActionForm, Checkbox, Field, SubmitButton } from "./form";

function Perms({ o, b, s }: { o?: boolean; b?: boolean; s?: boolean }) {
  return (
    <fieldset className="mb-4">
      <legend className="field-label">Юуг харуулахыг зөвшөөрөх вэ?</legend>
      <Checkbox name="canViewOrders" label="Миний захиалгууд" defaultChecked={o} />
      <Checkbox name="canViewBookings" label="Миний үйлчилгээний захиалга, цагийн хуваарь" defaultChecked={b} />
      <Checkbox name="canViewSupport" label="Миний тусламжийн хүсэлтүүд" defaultChecked={s} />
    </fieldset>
  );
}

export function InviteForm() {
  return (
    <ActionForm action={inviteCaregiver} label="Асран хамгаалагч урих">
      <Field name="email" label="Асран хамгаалагчийн имэйл" type="email" required hint="Тэр хүн энэ сайтад бүртгэлтэй байх ёстой." />
      <Perms />
      <SubmitButton>Урилга илгээх</SubmitButton>
    </ActionForm>
  );
}

export function PermForm({ linkId, o, b, s }: { linkId: string; o: boolean; b: boolean; s: boolean }) {
  return (
    <ActionForm action={updateCaregiverPermissions} label="Зөвшөөрөл өөрчлөх">
      <input type="hidden" name="linkId" value={linkId} />
      <Perms o={o} b={b} s={s} />
      <SubmitButton variant="secondary">Зөвшөөрөл хадгалах</SubmitButton>
    </ActionForm>
  );
}

export function RevokeForm({ linkId, label = "Хандалтыг цуцлах" }: { linkId: string; label?: string }) {
  return (
    <ActionForm action={revokeCaregiver}>
      <input type="hidden" name="linkId" value={linkId} />
      <SubmitButton variant="danger">{label}</SubmitButton>
    </ActionForm>
  );
}

export function RespondForm({ linkId }: { linkId: string }) {
  return (
    <ActionForm action={respondInvite}>
      <input type="hidden" name="linkId" value={linkId} />
      <div className="flex flex-wrap gap-3">
        <button type="submit" name="decision" value="accept" className="btn btn-primary">Хүлээн авах</button>
        <button type="submit" name="decision" value="decline" className="btn btn-secondary">Татгалзах</button>
      </div>
    </ActionForm>
  );
}
