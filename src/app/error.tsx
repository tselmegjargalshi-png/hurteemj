"use client";

export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div role="alert" className="mx-auto max-w-2xl">
      <h1 className="text-3xl font-bold">Алдаа гарлаа</h1>
      <p className="mt-3 text-lg">Уучлаарай, түр зуурын алдаа гарлаа. Дахин оролдоно уу.</p>
      <button type="button" onClick={reset} className="btn btn-primary mt-4">Дахин оролдох</button>
    </div>
  );
}
