import { AssistantConfigForm } from "@/components/admin-forms2";
import { getSetting } from "@/lib/settings";

export const metadata = { title: "Админ: AI туслах" };

export default async function AdminAssistant() {
  const cfg = (await getSetting("assistant_config")) ?? { enabled: true, extraInstructions: "" };
  return (
    <div>
      <h1 className="text-3xl font-bold">AI туслах</h1>
      <div className="mt-6 max-w-2xl"><AssistantConfigForm enabled={cfg.enabled} extra={cfg.extraInstructions} keyPresent={Boolean(process.env.ANTHROPIC_API_KEY)} /></div>
    </div>
  );
}
