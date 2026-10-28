export const metadata = { title: "Хандах эрхгүй" };
export default function Forbidden() {
  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-3xl font-bold">Хандах эрхгүй</h1>
      <p className="notice notice-danger mt-4">Танд энэ хуудсыг үзэх эрх байхгүй байна.</p>
    </div>
  );
}
