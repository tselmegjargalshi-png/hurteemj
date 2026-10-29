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

export const SERVICE_CATEGORY_LABELS = {
  rehabilitation: "Сэргээн засах үйлчилгээ",
  equipment_repair: "Тоног төхөөрөмжийн засвар",
  wheelchair_repair: "Тэргэнцэр, туслах төхөөрөмжийн засвар үйлчилгээ",
  home_assistance: "Гэрийн туслах үйлчилгээ",
  accessible_transport: "Хүртээмжтэй тээврийн үйлчилгээ",
  sign_language: "Дохионы хэлний орчуулагч",
  accessibility_consulting: "Хүртээмжийн зөвлөгөө",
  caregiving: "Асран хамгаалагчийн үйлчилгээ",
} as const;

export const BOOKING_STATUS_LABELS = {
  requested: "Хүсэлт илгээсэн",
  confirmed: "Баталгаажсан",
  completed: "Дууссан",
  cancelled: "Цуцлагдсан",
  rejected: "Татгалзсан",
} as const;

export const PLACE_TYPE_LABELS = {
  hospital: "Эмнэлэг",
  pharmacy: "Эмийн сан",
  restaurant: "Ресторан",
  shop: "Дэлгүүр",
  government: "Төрийн байгууллага",
  bank: "Банк",
  education: "Сургалтын төв",
  leisure: "Амралт, үйлчилгээний газар",
} as const;

export const PLACE_FEATURE_LABELS = {
  ramp: "Налуу зам",
  elevator: "Лифт",
  wheelchair_entrance: "Тэргэнцэртэй нэвтрэх боломж",
  accessible_toilet: "Хүртээмжтэй ариун цэврийн өрөө",
  visual_accessibility: "Харааны хүртээмж",
  hearing_accessibility: "Сонсголын хүртээмж",
  accessible_parking: "Хүртээмжтэй зогсоол",
} as const;

export const FEATURE_VALUE_LABELS = { yes: "Бий", partial: "Хэсэгчлэн", no: "Байхгүй", unknown: "Мэдэгдэхгүй" } as const;

export const VERIFICATION_LABELS = {
  unverified: "Баталгаажаагүй",
  community_reported: "Хэрэглэгчийн мэдээлсэн (баталгаажаагүй)",
  verified: "Баталгаажсан",
} as const;

export const JOB_STATUS_LABELS = { pending_review: "Шалгагдаж байна", published: "Нийтлэгдсэн", closed: "Хаагдсан", rejected: "Татгалзсан" } as const;
export const APPLICATION_STATUS_LABELS = { submitted: "Илгээсэн", reviewed: "Хянасан", accepted: "Зөвшөөрсөн", rejected: "Татгалзсан", withdrawn: "Буцаасан" } as const;

export const POST_TYPE_LABELS = {
  question: "Асуулт",
  experience: "Туршлага хуваалцах",
  event: "Арга хэмжээ",
  training: "Сургалт",
  volunteer: "Сайн дурын тусламж",
  info: "Хэрэгцээт мэдээлэл",
  feedback: "Санал хүсэлт",
} as const;

export const MODERATION_LABELS = { pending: "Хянагдаж байна", published: "Нийтлэгдсэн", hidden: "Нуусан", removed: "Устгасан" } as const;

export const REPORT_REASONS = {
  abuse: "Доромжлол, дайралт",
  fraud: "Залилан, хуурамч зар",
  medical: "Буруу эмчилгээний зөвлөгөө",
  privacy: "Хувийн мэдээлэл задруулсан",
  other: "Бусад",
} as const;
