import { PostForm } from "@/components/community-forms";
import { requireUser } from "@/lib/auth";

export const metadata = { title: "Шинэ нийтлэл" };

export default async function NewPost({ searchParams }: { searchParams: Promise<{ type?: string }> }) {
  await requireUser("/community/new");
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-3xl font-bold">Шинэ нийтлэл</h1>
      <div className="card mt-6 p-6"><PostForm defaultType={(await searchParams).type} /></div>
    </div>
  );
}
