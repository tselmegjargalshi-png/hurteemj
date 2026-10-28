import Link from "next/link";
import { redirect } from "next/navigation";
import { RegisterForm } from "@/components/auth-forms";
import { getCurrentUser, safeReturnPath } from "@/lib/auth";

export const metadata = { title: "Бүртгүүлэх" };

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const next = safeReturnPath((await searchParams).next);
  if (await getCurrentUser()) redirect(next);
  return (
    <div className="mx-auto max-w-lg">
      <h1 className="text-3xl font-bold">Бүртгүүлэх</h1>
      <p className="mt-2 text-muted">Бүртгэлтэй бол <Link href={`/login?next=${encodeURIComponent(next)}`} className="underline">нэвтрэх</Link>.</p>
      <div className="card mt-6 p-6">
        <RegisterForm next={next} />
      </div>
    </div>
  );
}
