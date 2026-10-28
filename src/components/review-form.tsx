"use client";

import { submitReview } from "@/app/actions/reviews";
import { ActionForm, Field, RadioGroup, SubmitButton } from "./form";

export function ReviewForm({ productId }: { productId: string }) {
  return (
    <section aria-labelledby="review-form-title" className="card mt-6 p-5">
      <h3 id="review-form-title" className="mb-4 text-xl font-bold">Үнэлгээ бичих</h3>
      <ActionForm action={submitReview}>
        <input type="hidden" name="productId" value={productId} />
        <RadioGroup
          name="rating"
          legend="Үнэлгээ (1-ээс 5)"
          required
          options={[5, 4, 3, 2, 1].map((n) => ({ value: String(n), label: `${n} — ${["", "Маш муу", "Муу", "Дунд", "Сайн", "Маш сайн"][n]}` }))}
        />
        <Field name="body" label="Сэтгэгдэл" as="textarea" required hint="Бүтээгдэхүүн танд хэрхэн тус болсон талаар бичнэ үү. Эмчилгээний зөвлөгөө бүү бичнэ үү." />
        <SubmitButton>Үнэлгээ илгээх</SubmitButton>
      </ActionForm>
    </section>
  );
}
