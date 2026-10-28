"use client";

import { createContext, useActionState, useContext, useEffect, useRef, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { initialState, type ActionState } from "@/lib/forms";

type Ctx = { state: ActionState };
const FormCtx = createContext<Ctx>({ state: initialState });

export function useFormCtx() {
  return useContext(FormCtx);
}

export const fieldId = (name: string) => `f-${name.replace(/[^a-zA-Z0-9_-]/g, "-")}`;

/**
 * Хүртээмжтэй маягт:
 * - JavaScript-гүй үед ч ажиллана (server action).
 * - Алдаа гарвал алдааны хураангуйг дэлгэц уншигч зарлаж, фокус тийш шилжинэ; хураангуйн холбоос тухайн талбар руу аваачна.
 * - Амжилттай бол role="status"-оор зарлана.
 */
export function ActionForm({
  action,
  children,
  className,
  label,
  resetOnSuccess = false,
}: {
  action: (state: ActionState, fd: FormData) => Promise<ActionState>;
  children: ReactNode;
  className?: string;
  label?: string;
  resetOnSuccess?: boolean;
}) {
  const [state, formAction] = useActionState(action, initialState);
  const summaryRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.status === "error") summaryRef.current?.focus();
    if (state.status === "success" && resetOnSuccess) formRef.current?.reset();
  }, [state.submissionId, state.status, resetOnSuccess]);

  const errors = Object.entries(state.fieldErrors ?? {});

  return (
    <FormCtx.Provider value={{ state }}>
      <form ref={formRef} action={formAction} className={className} aria-label={label} noValidate>
        {state.status === "error" && (
          <div ref={summaryRef} tabIndex={-1} role="alert" className="notice notice-danger mb-6">
            <h2 className="text-lg font-bold">
              {errors.length > 0 ? `Маягтад ${errors.length} алдаа байна` : "Алдаа гарлаа"}
            </h2>
            {state.message && <p className="mt-1">{state.message}</p>}
            {errors.length > 0 && (
              <ul className="mt-2 list-disc pl-6">
                {errors.map(([name, msg]) => (
                  <li key={name}>
                    <a href={`#${fieldId(name)}`} className="underline">
                      {msg}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
        <div role="status" aria-live="polite">
          {state.status === "success" && state.message && <p className="notice notice-success mb-6 font-semibold">{state.message}</p>}
        </div>
        {children}
      </form>
    </FormCtx.Provider>
  );
}

type FieldProps = {
  name: string;
  label: string;
  hint?: string;
  required?: boolean;
  defaultValue?: string | number | null;
  type?: string;
  autoComplete?: string;
  inputMode?: "text" | "numeric" | "tel" | "email" | "search" | "decimal" | "url";
  as?: "input" | "textarea" | "select";
  options?: { value: string; label: string }[];
  rows?: number;
  min?: number;
  max?: number;
  step?: number;
  className?: string;
};

export function Field({ name, label, hint, required, defaultValue, as = "input", options, className, ...rest }: FieldProps) {
  const { state } = useFormCtx();
  const id = fieldId(name);
  const error = state.fieldErrors?.[name];
  const value = state.values?.[name] ?? (defaultValue == null ? "" : String(defaultValue));
  const describedBy = [hint ? `${id}-hint` : null, error ? `${id}-error` : null].filter(Boolean).join(" ") || undefined;
  const common = {
    id,
    name,
    "aria-invalid": error ? (true as const) : undefined,
    "aria-describedby": describedBy,
    "aria-required": required || undefined,
    className: "field-input",
  };
  // submissionId-аар key өгч, алдааны дараа хэрэглэгчийн оруулсан утгыг сэргээнэ.
  const key = `${name}-${state.submissionId ?? 0}`;

  return (
    <div className={className ?? "mb-5"}>
      <label htmlFor={id} className="field-label">
        {label}
        {required ? <span aria-hidden="true"> *</span> : <span className="font-normal text-muted"> (заавал биш)</span>}
      </label>
      {hint && (
        <span id={`${id}-hint`} className="field-hint">
          {hint}
        </span>
      )}
      {error && (
        <span id={`${id}-error`} className="field-error">
          <span aria-hidden="true">⚠ </span>
          <span className="sr-only">Алдаа: </span>
          {error}
        </span>
      )}
      {as === "textarea" ? (
        <textarea key={key} {...common} defaultValue={value} rows={rest.rows ?? 5} />
      ) : as === "select" ? (
        <select key={key} {...common} defaultValue={value}>
          {options?.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      ) : (
        <input
          key={key}
          {...common}
          type={rest.type ?? "text"}
          defaultValue={rest.type === "password" ? undefined : value}
          autoComplete={rest.autoComplete}
          inputMode={rest.inputMode}
          min={rest.min}
          max={rest.max}
          step={rest.step}
        />
      )}
    </div>
  );
}

export function Checkbox({ name, label, hint, defaultChecked }: { name: string; label: string; hint?: string; defaultChecked?: boolean }) {
  const { state } = useFormCtx();
  const id = fieldId(name);
  const error = state.fieldErrors?.[name];
  const checked = state.values ? state.values[name] === "on" : !!defaultChecked;
  const describedBy = [hint ? `${id}-hint` : null, error ? `${id}-error` : null].filter(Boolean).join(" ") || undefined;
  return (
    <div className="mb-3">
      {error && (
        <span id={`${id}-error`} className="field-error">
          <span aria-hidden="true">⚠ </span>
          {error}
        </span>
      )}
      <label htmlFor={id} className="check-row">
        <input
          key={`${name}-${state.submissionId ?? 0}`}
          id={id}
          type="checkbox"
          name={name}
          defaultChecked={checked}
          aria-describedby={describedBy}
          aria-invalid={error ? true : undefined}
        />
        <span>
          <span className="font-semibold">{label}</span>
          {hint && (
            <span id={`${id}-hint`} className="block text-muted">
              {hint}
            </span>
          )}
        </span>
      </label>
    </div>
  );
}

export function RadioGroup({
  name,
  legend,
  hint,
  options,
  defaultValue,
  required,
}: {
  name: string;
  legend: string;
  hint?: string;
  options: { value: string; label: string; description?: string }[];
  defaultValue?: string;
  required?: boolean;
}) {
  const { state } = useFormCtx();
  const id = fieldId(name);
  const error = state.fieldErrors?.[name];
  const current = state.values?.[name] ?? defaultValue;
  return (
    <fieldset id={id} tabIndex={-1} className="mb-6" aria-describedby={[hint ? `${id}-hint` : null, error ? `${id}-error` : null].filter(Boolean).join(" ") || undefined}>
      <legend className="field-label text-lg">
        {legend}
        {required && <span aria-hidden="true"> *</span>}
      </legend>
      {hint && (
        <span id={`${id}-hint`} className="field-hint">
          {hint}
        </span>
      )}
      {error && (
        <span id={`${id}-error`} className="field-error">
          <span aria-hidden="true">⚠ </span>
          {error}
        </span>
      )}
      <div className="grid gap-2">
        {options.map((o) => (
          <label key={o.value} className="check-row card px-4">
            <input
              key={`${name}-${o.value}-${state.submissionId ?? 0}`}
              type="radio"
              name={name}
              value={o.value}
              defaultChecked={current === o.value}
              aria-describedby={o.description ? `${id}-${o.value}-desc` : undefined}
            />
            <span>
              <span className="font-semibold">{o.label}</span>
              {o.description && (
                <span id={`${id}-${o.value}-desc`} className="block text-muted">
                  {o.description}
                </span>
              )}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export function SubmitButton({ children, pendingText = "Илгээж байна…", variant = "primary", className = "" }: { children: ReactNode; pendingText?: string; variant?: "primary" | "secondary" | "danger"; className?: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={`btn btn-${variant} ${className}`} aria-disabled={pending}>
      {pending ? pendingText : children}
    </button>
  );
}
