import "server-only";

/**
 * Гадны үйлчилгээний БОДИТ төлөв. UI энэ мэдээллээр л "холбогдсон" эсэхийг харуулна —
 * хэзээ ч холбогдсон мэт дүр эсгэхгүй.
 */
export function integrationStatus() {
  return {
    qpay: {
      name: "QPay төлбөр",
      connected: false,
      note: "Код хэрэгжүүлээгүй. QPay мерчант гэрээ, QPAY_CLIENT_ID / QPAY_CLIENT_SECRET / QPAY_INVOICE_CODE шаардлагатай.",
    },
    ai: {
      name: "AI туслах",
      connected: false,
      keyPresent: Boolean(process.env.ANTHROPIC_API_KEY),
      note: "VI үе шатанд хэрэгжүүлнэ. ANTHROPIC_API_KEY (сервер талд) шаардлагатай.",
    },
    maps: {
      name: "Газрын зураг",
      connected: false,
      note: "Ашиглах эрхтэй газрын зургийн үйлчилгээ сонгогдоогүй. Газрын мэдээлэл хаягаар харагдана.",
    },
    sms: { name: "SMS мэдэгдэл", connected: false, note: "SMS үйлчилгээ холбогдоогүй. Мэдэгдэл сайт дээр бичгээр харагдана." },
    email: { name: "Имэйл мэдэгдэл", connected: false, note: "Имэйл илгээх үйлчилгээ холбогдоогүй." },
    signLanguage: {
      name: "Дохионы хэлний автомат орчуулга",
      connected: false,
      note: "Найдвартай автомат орчуулга байхгүй тул санал болгохгүй. Хүн орчуулагчийн үйлчилгээг үйлчилгээний хэсгээр холбоно.",
    },
  };
}
