export const metadata = { title: "Хувийн мэдээллийн бодлого" };

export default function Privacy() {
  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <h1 className="text-3xl font-bold">Хувийн мэдээллийн бодлого</h1>
      <p className="notice notice-warning">Энэ нь туршилтын хувилбарын товч тайлбар. Албан ёсны бодлогыг хуульч хянаж баталсны дараа нийтэлнэ.</p>
      <h2 className="text-xl font-bold">Бид юуг цуглуулдаг</h2>
      <ul className="list-disc pl-6">
        <li>Нэр, имэйл, утасны дугаар, захиалгын хаяг — захиалга биелүүлэх зорилгоор.</li>
        <li>Хүртээмжийн тохиргоо (том үсэг, өндөр ялгарал гэх мэт) — зөвхөн интерфэйсийг тохируулахад.</li>
        <li>Тусламжийн хүсэлтийн агуулга.</li>
      </ul>
      <h2 className="text-xl font-bold">Бид юуг цуглуулдаггүй</h2>
      <ul className="list-disc pl-6">
        <li>Хөгжлийн бэрхшээлийн төрөл, онош, эрүүл мэндийн мэдээлэл.</li>
        <li>Төлбөрийн картын мэдээлэл.</li>
      </ul>
      <p>Нууц үгийг bcrypt-ээр хэшлэж хадгална. Таны мэдээллийг зөвшөөрөлгүйгээр бусдад харуулахгүй.</p>
    </div>
  );
}
