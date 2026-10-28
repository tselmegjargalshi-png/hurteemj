import type { ZodError } from "zod";

export type ActionState = {
  status: "idle" | "error" | "success";
  message?: string;
  fieldErrors?: Record<string, string>;
  /** Алдаа гарсан үед хэрэглэгчийн оруулсан утгыг буцааж харуулна (нууц үгээс бусад). */
  values?: Record<string, string>;
  submissionId?: number;
};

export const initialState: ActionState = { status: "idle" };

const SECRET_FIELDS = new Set(["password", "passwordConfirm", "currentPassword"]);

export function formValues(fd: FormData): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of fd.entries()) {
    if (typeof v === "string" && !k.startsWith("$ACTION") && !SECRET_FIELDS.has(k)) out[k] = v;
  }
  return out;
}

export function zodErrorState(error: ZodError, fd: FormData): ActionState {
  const fieldErrors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".");
    if (key && !fieldErrors[key]) fieldErrors[key] = issue.message;
  }
  return { status: "error", fieldErrors, values: formValues(fd), submissionId: Date.now() };
}

export function errorState(message: string, fd?: FormData, fieldErrors?: Record<string, string>): ActionState {
  return { status: "error", message, fieldErrors, values: fd ? formValues(fd) : undefined, submissionId: Date.now() };
}

export function successState(message: string): ActionState {
  return { status: "success", message, submissionId: Date.now() };
}
