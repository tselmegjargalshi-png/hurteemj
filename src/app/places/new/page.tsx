import { SuggestPlaceForm } from "@/components/place-forms";
import { requireUser } from "@/lib/auth";

export const metadata = { title: "Газар санал болгох" };

export default async function NewPlace() {
  await requireUser("/places/new");
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-3xl font-bold">Хүртээмжтэй газар санал болгох</h1>
      <div className="card mt-6 p-6"><SuggestPlaceForm /></div>
    </div>
  );
}
