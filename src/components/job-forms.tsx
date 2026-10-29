"use client";

import { useState } from "react";
import { applyJob, closeJob, createJob, setApplicationStatus } from "@/app/actions/jobs";
import { ActionForm, Checkbox, Field, SubmitButton } from "./form";

export function JobForm() {
  return (
    <ActionForm action={createJob} label="Ажлын байр нэмэх">
      <Field name="title" label="Ажлын байрны нэр" required />
      <Field name="organization" label="Байгууллагын нэр" required />
      <Field name="description" label="Тайлбар, үүрэг, шаардлага" as="textarea" rows={7} required />
      <Field name="location" label="Байршил" />
      <Checkbox name="isRemote" label="Зайнаас ажиллах боломжтой" />
      <Field name="salaryInfo" label="Цалингийн мэдээлэл" hint="Баталгаатай мэдээлэл л бичнэ үү. Тодорхойгүй бол хоосон орхино." />
      <Field name="accessibilityInfo" label="Хүртээмжтэй ажлын байрны нөхцөл" as="textarea" rows={3} hint="Жишээ нь: лифттэй, налуу замтай, дэлгэц уншигч програмтай, уян хатан цаг." />
      <Field name="applyDeadline" label="Хүсэлт хүлээн авах сүүлийн өдөр" type="date" />
      <p className="notice notice-info mb-4">Ажлын байрыг администратор шалгаж баталгаажуулсны дараа нийтэд харагдана.</p>
      <SubmitButton>Шалгуулахаар илгээх</SubmitButton>
    </ActionForm>
  );
}

export function ApplyForm({ jobId, initialCv }: { jobId: string; initialCv?: string }) {
  return (
    <ActionForm action={applyJob} label="Ажилд хүсэлт илгээх">
      <input type="hidden" name="jobId" value={jobId} />
      <Field name="coverLetter" label="Танилцуулга" as="textarea" rows={5} required />
      <Field name="cv" label="CV (текст)" as="textarea" rows={8} defaultValue={initialCv} hint="CV үүсгэгчээр бэлдсэнээ энд буулгаж болно." />
      <SubmitButton pendingText="Илгээж байна…">Хүсэлт илгээх</SubmitButton>
    </ActionForm>
  );
}

export function ApplicationStatusForm({ id }: { id: string }) {
  return (
    <ActionForm action={setApplicationStatus}>
      <input type="hidden" name="applicationId" value={id} />
      <Field className="" name="status" as="select" label="Төлөв" options={[{ value: "reviewed", label: "Хянасан" }, { value: "accepted", label: "Зөвшөөрсөн" }, { value: "rejected", label: "Татгалзсан" }]} />
      <div className="mt-2"><SubmitButton variant="secondary">Хадгалах</SubmitButton></div>
    </ActionForm>
  );
}

export function CloseJobForm({ id, title }: { id: string; title: string }) {
  return (
    <ActionForm action={closeJob}>
      <input type="hidden" name="jobId" value={id} />
      <SubmitButton variant="danger">Хаах<span className="sr-only"> {title}</span></SubmitButton>
    </ActionForm>
  );
}

/** CV үүсгэгч: бүх зүйл хөтөч дээр боловсруулагдана, сервер рүү илгээгдэхгүй, хадгалагдахгүй. */
export function CvBuilder() {
  const [f, setF] = useState({ name: "", phone: "", email: "", summary: "", education: "", experience: "", skills: "" });
  const [copied, setCopied] = useState("");
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });
  const text = [
    f.name && `${f.name}`,
    [f.phone, f.email].filter(Boolean).join(" · "),
    f.summary && `\nТАНИЛЦУУЛГА\n${f.summary}`,
    f.education && `\nБОЛОВСРОЛ\n${f.education}`,
    f.experience && `\nАЖЛЫН ТУРШЛАГА\n${f.experience}`,
    f.skills && `\nУР ЧАДВАР\n${f.skills}`,
  ].filter(Boolean).join("\n");
  const field = (id: keyof typeof f, label: string, area = false) => (
    <div className="mb-4">
      <label htmlFor={`cv-${id}`} className="field-label">{label}</label>
      {area ? <textarea id={`cv-${id}`} className="field-input" rows={4} value={f[id]} onChange={set(id)} /> : <input id={`cv-${id}`} className="field-input" value={f[id]} onChange={set(id)} />}
    </div>
  );
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <form onSubmit={(e) => e.preventDefault()} aria-label="CV мэдээлэл">
        {field("name", "Овог нэр")}{field("phone", "Утас")}{field("email", "Имэйл")}
        {field("summary", "Товч танилцуулга", true)}{field("education", "Боловсрол", true)}{field("experience", "Ажлын туршлага", true)}{field("skills", "Ур чадвар", true)}
      </form>
      <section aria-labelledby="cv-preview">
        <h2 id="cv-preview" className="text-xl font-bold">Урьдчилан харах</h2>
        <pre className="card mt-2 whitespace-pre-wrap p-4 font-sans" aria-live="polite">{text || "Мэдээллээ оруулна уу."}</pre>
        <button type="button" className="btn btn-primary mt-3" onClick={async () => { try { await navigator.clipboard.writeText(text); setCopied("CV хуулагдлаа. Ажлын хүсэлтийн CV талбарт буулгана уу."); } catch { setCopied("Хуулж чадсангүй. Текстийг гараар сонгож хуулна уу."); } }}>CV хуулах</button>
        <p role="status" className="mt-2">{copied}</p>
      </section>
    </div>
  );
}
