import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { getPreferences, prefsToHtmlAttrs } from "@/lib/preferences";

export const metadata: Metadata = {
  title: { default: "Хүртээмж — хүртээмжтэй дэлгүүр, үйлчилгээ", template: "%s | Хүртээмж" },
  description: "Хөгжлийн бэрхшээлтэй хүмүүст зориулсан туслах хэрэгсэл, үйлчилгээ, мэдээллийн хүртээмжтэй платформ.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // Томруулахыг хэзээ ч хориглохгүй (WCAG 1.4.4).
  themeColor: "#0a4a85",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { prefs } = await getPreferences();
  return (
    <html lang="mn" {...prefsToHtmlAttrs(prefs)}>
      <body className="min-h-screen">
        <a href="#main" className="skip-link">
          Үндсэн агуулга руу шилжих
        </a>
        <Header />
        <main id="main" tabIndex={-1} className="container-page py-8 focus:outline-none">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
