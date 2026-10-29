import { becomeEmployer } from "@/app/actions/jobs";
import { JobForm } from "@/components/job-forms";
import { requireUser } from "@/lib/auth";

export const metadata = { title: "Ажлын байр нэмэх" };

export default async function NewJob() {
  const user = await requireUser("/jobs/new");
  const ok = user.role === "employer" || user.role === "admin";
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-3xl font-bold">Ажлын байр нэмэх</h1>
      {ok ? <div className="card mt-6 p-6"><JobForm /></div> : (
        <div className="card mt-6 p-6">
          <p>Ажлын байр нэмэхийн тулд бүртгэлээ ажил олгогчийн эрхтэй болгоно. Ажил олгогчийн «баталгаажсан» тэмдгийг администратор тусад нь олгоно.</p>
          <form action={becomeEmployer} className="mt-4"><button type="submit" className="btn btn-primary">Ажил олгогчоор бүртгүүлэх</button></form>
        </div>
      )}
    </div>
  );
}
