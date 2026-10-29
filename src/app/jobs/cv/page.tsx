import { CvBuilder } from "@/components/job-forms";

export const metadata = { title: "CV үүсгэх туслах" };

export default function CvPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold">CV үүсгэх туслах</h1>
      <p className="notice notice-info my-4">Таны оруулсан мэдээлэл зөвхөн энэ хөтөч дээр боловсруулагдана, серверт илгээгдэхгүй, хадгалагдахгүй. Дууссаны дараа хуулж, ажлын хүсэлтдээ буулгана.</p>
      <CvBuilder />
    </div>
  );
}
