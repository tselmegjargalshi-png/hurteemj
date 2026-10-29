import { AssistantForm } from "@/components/assistant-form";

export const metadata = { title: "Туслах" };

export default function AssistantPage() {
  const aiConnected = Boolean(process.env.ANTHROPIC_API_KEY);
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-3xl font-bold">Туслах</h1>
      <div className="notice notice-warning my-4">
        <p className="font-semibold">Туслах юуг хийж чадахгүй вэ</p>
        <ul className="mt-1 list-disc pl-6">
          <li>Эмчийн онош, эмчилгээний зөвлөгөө, мэргэжлийн тохируулгыг орлохгүй.</li>
          <li>Яаралтай тусламжийг орлохгүй: 103 (түргэн тусламж), 105 (аврах алба), 102 (цагдаа).</li>
          <li>Захиалга өгөх, төлбөр хийх үйлдлийг өөрөө хийхгүй, зөвхөн холбогдох хуудас руу чиглүүлнэ.</li>
          <li>Яриаг хадгалахгүй.</li>
        </ul>
      </div>
      <AssistantForm aiConnected={aiConnected} />
    </div>
  );
}
