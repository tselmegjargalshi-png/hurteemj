import { SettingsForm } from "@/components/admin-forms";
import { getSetting } from "@/lib/settings";

export const metadata = { title: "Админ: тохиргоо" };

export default async function AdminSettings() {
  const [bank, ann] = await Promise.all([getSetting("bank_transfer_info"), getSetting("home_announcement")]);
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-3xl font-bold">Сайтын тохиргоо</h1>
      <div className="card mt-4 p-5"><SettingsForm bank={bank} announcement={ann?.text ?? ""} /></div>
    </div>
  );
}
