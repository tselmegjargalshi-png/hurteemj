import { PreferencesForm } from "@/components/preferences-form";
import { getPreferences } from "@/lib/preferences";

export const metadata = { title: "Хүртээмжийн тохиргоо" };

export default async function AccessibilitySettingsPage() {
  const { prefs } = await getPreferences();
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-3xl font-bold">Хүртээмжийн тохиргоо</h1>
      <p className="mt-3 text-lg">
        Өөртөө тохирох сонголтыг хийнэ үү. Бүх тохиргоо заавал биш. Бид таны хөгжлийн бэрхшээлийн талаар асуухгүй — зөвхөн интерфэйсийн сонголт хадгална.
      </p>
      <div className="notice notice-info my-6">
        <h2 className="font-bold">Тохиргоогүйгээр ч ажиллана</h2>
        <ul className="mt-2 list-disc space-y-1 pl-6">
          <li>Сайт бүхэлдээ дэлгэц уншигч (NVDA, JAWS, VoiceOver, TalkBack)-тай нийцэхээр бүтээгдсэн.</li>
          <li>Бүх үйлдлийг гараар (Tab, Shift+Tab, Enter, Space) хийх боломжтой. Чирж зөөх шаардлагагүй.</li>
          <li>Бүх мэдэгдэл бичгээр харагдана, дуут дохио ашигладаггүй.</li>
          <li>Нүдний хөдөлгөөн, толгойн удирдлага, тусгай унтраалга, дуут удирдлага нь таны төхөөрөмж, үйлдлийн системийн дэмжлэгээр ажиллана (жишээ нь Windows Voice Access, iOS Switch Control). Бид эдгээрт саад болохгүй стандарт HTML ашигладаг.</li>
          <li>Хөтчийн томруулалт (Ctrl + +) 400% хүртэл ажиллана.</li>
        </ul>
      </div>
      <PreferencesForm prefs={prefs} />
    </div>
  );
}
