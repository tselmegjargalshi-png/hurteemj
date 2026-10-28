import Link from "next/link";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth-forms";
import { getCurrentUser, safeReturnPath } from "@/lib/auth";

export const metadata = { title: "Нэвтрэх" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const next = safeReturnPath((await searchParams).next);
  if (await getCurrentUser()) redirect(next);
  return (
    <div className="mx-auto max-w-lg">
      <h1 className="text-3xl font-bold">Нэвтрэх</h1>
      <p className="mt-2 text-muted">Бүртгэлгүй бол <Link href={`/register?next=${encodeURIComponent(next)}`} className="underline">шинээр бүртгүүлэх</Link>. Харагдахгүй CAPTCHA ашигладаггүй.</p>
      <div className="card mt-6 p-6">
        <LoginForm next={next} />
      </div>
    </div>
  );
}
