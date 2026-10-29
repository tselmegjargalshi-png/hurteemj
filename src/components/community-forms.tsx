"use client";

import { createPost, createReply, reportContent } from "@/app/actions/community";
import { POST_TYPE_LABELS, REPORT_REASONS } from "@/lib/labels";
import { ActionForm, Field, SubmitButton } from "./form";

export function PostForm({ defaultType }: { defaultType?: string }) {
  return (
    <ActionForm action={createPost} label="Шинэ нийтлэл">
      <Field name="type" as="select" label="Төрөл" required defaultValue={defaultType} options={[{ value: "", label: "— сонгох —" }, ...Object.entries(POST_TYPE_LABELS).map(([value, label]) => ({ value, label }))]} />
      <Field name="title" label="Гарчиг" required />
      <Field name="body" label="Агуулга" as="textarea" rows={7} required hint="Хувийн мэдээлэл (утас, хаяг, эрүүл мэндийн дэлгэрэнгүй) бүү бичээрэй. Эмчилгээний зөвлөгөө өгч болохгүй." />
      <p className="notice notice-info mb-4">Нийтлэлийг администратор хянасны дараа нийтэд харагдана.</p>
      <SubmitButton>Хянуулахаар илгээх</SubmitButton>
    </ActionForm>
  );
}

export function ReplyForm({ postId }: { postId: string }) {
  return (
    <ActionForm action={createReply} label="Хариулах" resetOnSuccess>
      <input type="hidden" name="postId" value={postId} />
      <Field name="body" label="Таны хариулт" as="textarea" rows={4} required />
      <SubmitButton>Хариулах</SubmitButton>
    </ActionForm>
  );
}

export function ReportForm({ targetType, targetId }: { targetType: "post" | "reply" | "place" | "job" | "product"; targetId: string }) {
  return (
    <details className="mt-2">
      <summary className="cursor-pointer underline">Мэдээлэх (гомдол)</summary>
      <div className="mt-2">
        <ActionForm action={reportContent} label="Агуулгыг мэдээлэх" resetOnSuccess>
          <input type="hidden" name="targetType" value={targetType} />
          <input type="hidden" name="targetId" value={targetId} />
          <Field name="reason" as="select" label="Шалтгаан" required options={[{ value: "", label: "— сонгох —" }, ...Object.entries(REPORT_REASONS).map(([value, label]) => ({ value, label }))]} />
          <Field name="details" label="Нэмэлт тайлбар" as="textarea" rows={2} />
          <SubmitButton variant="secondary">Мэдээлэх</SubmitButton>
        </ActionForm>
      </div>
    </details>
  );
}
