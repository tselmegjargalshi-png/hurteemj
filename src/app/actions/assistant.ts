"use server";

import { getCurrentUser } from "@/lib/auth";
import { answer, type AssistantAnswer } from "@/lib/assistant";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export type AssistantState = { status: "idle" | "ok" | "error"; question?: string; result?: AssistantAnswer; message?: string; id?: number };

/** Яриаг серверт хадгалахгүй. Хэрэглэгчийн хөгжлийн бэрхшээлийн талаар асуухгүй. */
export async function askAssistant(_prev: AssistantState, fd: FormData): Promise<AssistantState> {
  const q = String(fd.get("question") ?? "").trim();
  if (q.length < 3) return { status: "error", message: "Асуултаа дор хаяж 3 тэмдэгтээр бичнэ үү.", question: q, id: Date.now() };
  if (q.length > 500) return { status: "error", message: "Асуулт 500 тэмдэгтээс хэтрэхгүй байх ёстой.", question: q, id: Date.now() };
  const user = await getCurrentUser();
  if (!(await rateLimit(`ai:${user?.id ?? (await clientIp())}`, user ? 30 : 10, 60 * 60))) return { status: "error", message: "Хэт олон асуулт илгээлээ. Түр хүлээгээд дахин оролдоно уу.", question: q, id: Date.now() };
  try {
    return { status: "ok", question: q, result: await answer(q), id: Date.now() };
  } catch (e) {
    console.error("assistant failed", e);
    return { status: "error", message: "Туслахтай холбогдоход алдаа гарлаа. Дахин оролдоно уу.", question: q, id: Date.now() };
  }
}
