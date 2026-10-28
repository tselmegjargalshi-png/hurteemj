"use client";

import { cancelOwnOrder } from "@/app/actions/orders";
import { ActionForm, Checkbox, SubmitButton } from "./form";

export function CancelOrderForm({ orderId }: { orderId: string }) {
  return (
    <ActionForm action={cancelOwnOrder} label="Захиалга цуцлах">
      <input type="hidden" name="orderId" value={orderId} />
      {/* Санамсаргүй даралтаас хамгаалж, тусад нь баталгаажуулна. */}
      <Checkbox name="confirmCancel" label="Энэ захиалгыг цуцлахыг зөвшөөрч байна" />
      <SubmitButton variant="danger" pendingText="Цуцалж байна…">Захиалга цуцлах</SubmitButton>
    </ActionForm>
  );
}
