"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef } from "react";
import { askAssistant, type AssistantState } from "@/app/actions/assistant";
import { SubmitButton } from "./form";

const init: AssistantState = { status: "idle" };
const KIND = { product: "Бүтээгдэхүүн", service: "Үйлчилгээ", place: "Газар" } as const;

export function AssistantForm({ aiConnected }: { aiConnected: boolean }) {
  const [state, action] = useActionState(askAssistant, init);
  const out = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (state.status !== "idle") out.current?.focus();
  }, [state.id, state.status]);
  return (
    <div>
      <form action={action} noValidate>
        <label htmlFor="question" className="field-label text-lg">Асуултаа бичнэ үү</label>
        <span id="q-hint" className="field-hint">Жишээ нь: «250 мянган төгрөгийн төсөвт тэргэнцэр байна уу?» Хөгжлийн бэрхшээл, эрүүл мэндийн мэдээллээ бичих шаардлагагүй.</span>
        <textarea id="question" name="question" rows={3} maxLength={500} className="field-input" aria-describedby="q-hint" defaultValue={state.question} key={state.id ?? 0} />
        <div className="mt-3"><SubmitButton pendingText="Хайж байна…">Асуух</SubmitButton></div>
      </form>
      <div ref={out} tabIndex={-1} role="status" aria-live="polite" className="mt-6 focus:outline-none">
        {state.status === "error" && <p className="notice notice-danger font-semibold">{state.message}</p>}
        {state.status === "ok" && state.result && (
          <div>
            <div className={`notice ${state.result.mode === "ai" ? "notice-info" : "notice-warning"}`}>
              <p className="font-semibold">{state.result.mode === "ai" ? "AI туслахын хариулт" : "Энгийн хайлт (AI холбогдоогүй)"}</p>
              <p className="mt-1 whitespace-pre-line">{state.result.text}</p>
              {state.result.reason && <p className="mt-1 text-sm">{state.result.reason}</p>}
            </div>
            {state.result.sources.length > 0 && (
              <section aria-labelledby="srcs" className="mt-4"><h2 id="srcs" className="text-xl font-bold">Сайтаас олдсон мэдээлэл</h2>
                <ul className="mt-2 space-y-2" role="list">{state.result.sources.map((s) => <li key={s.href} className="card p-3"><span className="badge mr-2">{KIND[s.kind]}</span><Link href={s.href} className="font-semibold underline">{s.title}</Link><p>{s.detail}</p></li>)}</ul></section>
            )}
          </div>
        )}
      </div>
      {!aiConnected && <p className="mt-4 text-sm text-muted">Тэмдэглэл: AI үйлчилгээ одоогоор холбогдоогүй тул энэ хэсэг зөвхөн сайтын бодит өгөгдлөөс энгийн хайлт хийнэ.</p>}
    </div>
  );
}
