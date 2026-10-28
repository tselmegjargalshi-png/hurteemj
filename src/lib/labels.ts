/** Enum утгуудын Монгол нэршил — UI-д нэг газраас ашиглана. */
export const ORDER_STATUS_LABELS = {
  created: "Үүссэн",
  confirmed: "Баталгаажсан",
  processing: "Боловсруулагдаж байгаа",
  shipped: "Хүргэлтэд гарсан",
  delivered: "Хүргэгдсэн",
  cancelled: "Цуцлагдсан",
} as const;

export const ORDER_STATUS_FLOW = ["created", "confirmed", "processing", "shipped", "delivered"] as const;

export const PAYMENT_METHOD_LABELS = {
  cash_on_delivery: "Хүлээн авахдаа бэлнээр / картаар төлөх",
  bank_transfer: "Дансаар шилжүүлэх",
  qpay: "QPay",
} as const;

export const PAYMENT_STATUS_LABELS = {
  pending: "Төлөгдөөгүй (хүлээгдэж байна)",
  paid: "Төлөгдсөн",
  failed: "Амжилтгүй",
  refunded: "Буцаан олгосон",
  cancelled: "Цуцлагдсан",
} as const;

export const DELIVERY_STATUS_LABELS = {
  pending: "Хүлээгдэж байна",
  out_for_delivery: "Хүргэлтэд гарсан",
  delivered: "Хүргэгдсэн",
  failed: "Хүргэж чадаагүй",
} as const;

export const CONTACT_PREFERENCE_LABELS = {
  in_app: "Зөвхөн сайт дээрх бичгэн мэдэгдэл",
  sms: "Мессеж (SMS)",
  email: "Имэйл",
  phone_call: "Утасны дуудлага",
  video_call: "Видео дуудлага",
} as const;

export const SUPPORT_TYPE_LABELS = {
  product_choice: "Бүтээгдэхүүн сонгоход тусламж",
  order_question: "Захиалгын талаар асуух",
  place_visit: "Үйлчилгээний газар очиход тусламж",
  device_repair: "Туслах төхөөрөмжийн засвар",
  communication: "Харилцааны туслах үйлчилгээ",
  website_accessibility: "Вэбсайтын хүртээмжийн асуудал мэдээлэх",
  other: "Бусад",
} as const;

export const SUPPORT_STATUS_LABELS = {
  new: "Шинэ",
  in_progress: "Шийдвэрлэж байна",
  waiting_customer: "Таны хариуг хүлээж байна",
  resolved: "Шийдвэрлэсэн",
  closed: "Хаагдсан",
} as const;

export const ROLE_LABELS = {
  customer: "Худалдан авагч",
  service_provider: "Үйлчилгээ үзүүлэгч",
  supplier: "Бүтээгдэхүүн нийлүүлэгч",
  caregiver: "Асран хамгаалагч",
  employer: "Ажил олгогч",
  admin: "Администратор",
} as const;

export const PRODUCT_STATUS_LABELS = {
  draft: "Ноорог (харагдахгүй)",
  published: "Нийтлэгдсэн",
  archived: "Архивласан",
} as const;
