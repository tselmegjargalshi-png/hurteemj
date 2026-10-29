/**
 * Өгөгдлийн сангийн бүтэц.
 *
 * Зарчим:
 * - Хөгжлийн бэрхшээлийн төрөл, онош, эрүүл мэндийн мэдээллийг ХАДГАЛАХГҮЙ.
 *   Хүртээмжийн тохиргоо нь зөвхөн интерфэйсийн сонголт (том үсэг гэх мэт).
 * - Мөнгөн дүнг бүхэл тоогоор (₮) хадгална.
 * - Захиалгын мөрөнд бүтээгдэхүүний нэр, үнийг хуулбарлан хадгална (дараа нь үнэ өөрчлөгдөхөд түүх алдагдахгүй).
 * - Баталгаажаагүй мэдээллийг (үнэ, газар, үйлчилгээ үзүүлэгч) баталгаажсан гэж тэмдэглэх талбар тусдаа.
 */
import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  doublePrecision,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  serial,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

const createdAt = () => timestamp("created_at", { withTimezone: true }).notNull().defaultNow();
const updatedAt = () => timestamp("updated_at", { withTimezone: true }).notNull().defaultNow();

// ───────────────────────── Хэрэглэгч ─────────────────────────

export const userRole = pgEnum("user_role", [
  "customer", // Бүртгэлтэй худалдан авагч / үйлчилгээ хүсэгч
  "service_provider", // Үйлчилгээ үзүүлэгч
  "supplier", // Бүтээгдэхүүн нийлүүлэгч
  "caregiver", // Асран хамгаалагч
  "employer", // Ажил олгогч
  "admin", // Администратор
]);

export const userStatus = pgEnum("user_status", ["active", "blocked"]);

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: text("name").notNull(),
  phone: text("phone"),
  role: userRole("role").notNull().default("customer"),
  status: userStatus("status").notNull().default("active"),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const sessions = pgTable(
  "sessions",
  {
    // Cookie-д хадгалсан токены SHA-256 хэш. Токен өөрөө DB-д хадгалагдахгүй.
    id: text("id").primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: createdAt(),
  },
  (t) => [index("sessions_user_idx").on(t.userId)],
);

export const fontSize = pgEnum("font_size", ["normal", "large", "xlarge"]);
export const contentFormat = pgEnum("content_format", ["text", "text_simple", "text_with_video"]);

/** Хүртээмжийн тохиргоо — зөвхөн интерфэйсийн сонголт, эрүүл мэндийн мэдээлэл биш. */
export const userPreferences = pgTable("user_preferences", {
  userId: uuid("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  fontSize: fontSize("font_size").notNull().default("normal"),
  highContrast: boolean("high_contrast").notNull().default(false),
  reduceMotion: boolean("reduce_motion").notNull().default(false),
  largeTargets: boolean("large_targets").notNull().default(false),
  strongFocus: boolean("strong_focus").notNull().default(false),
  underlineLinks: boolean("underline_links").notNull().default(false),
  simpleLanguage: boolean("simple_language").notNull().default(false),
  screenReaderMode: boolean("screen_reader_mode").notNull().default(false),
  voiceInput: boolean("voice_input").notNull().default(false),
  contentFormat: contentFormat("content_format").notNull().default("text"),
  onboardingDone: boolean("onboarding_done").notNull().default(false),
  updatedAt: updatedAt(),
});

/** Асран хамгаалагчтай мэдээлэл хуваалцах — хэрэглэгч өөрөө зөвшөөрөл өгнө, хүссэн үедээ цуцална. */
export const caregiverLinkStatus = pgEnum("caregiver_link_status", ["pending", "active", "revoked"]);
export const caregiverLinks = pgTable(
  "caregiver_links",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    caregiverId: uuid("caregiver_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    canViewOrders: boolean("can_view_orders").notNull().default(false),
    canViewBookings: boolean("can_view_bookings").notNull().default(false),
    canViewSupport: boolean("can_view_support").notNull().default(false),
    status: caregiverLinkStatus("status").notNull().default("pending"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [uniqueIndex("caregiver_links_pair").on(t.userId, t.caregiverId)],
);

// ───────────────────────── Каталог ─────────────────────────

export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: createdAt(),
});

export const productStatus = pgEnum("product_status", ["draft", "published", "archived"]);
export const productCondition = pgEnum("product_condition", ["new", "used_inspected"]);

export type Spec = { label: string; value: string };

export const products = pgTable(
  "products",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: text("slug").notNull().unique(),
    name: text("name").notNull(),
    summary: text("summary").notNull().default(""),
    description: text("description").notNull().default(""),
    usage: text("usage").notNull().default(""),
    specifications: jsonb("specifications").$type<Spec[]>().notNull().default([]),
    suitableFor: text("suitable_for").notNull().default(""),
    cautions: text("cautions").notNull().default(""),
    priceMnt: integer("price_mnt").notNull(),
    /** Үнийг нийлүүлэгчтэй баталгаажуулсан эсэх. false үед "Үнэ баталгаажаагүй" гэж харуулна. */
    priceVerified: boolean("price_verified").notNull().default(false),
    stock: integer("stock").notNull().default(0),
    deliveryInfo: text("delivery_info").notNull().default(""),
    warrantyInfo: text("warranty_info").notNull().default(""),
    returnPolicy: text("return_policy").notNull().default(""),
    supplierName: text("supplier_name").notNull().default(""),
    /** Мэдээллийн эх сурвалж (үйлдвэрлэгчийн сайт гэх мэт). */
    sourceNote: text("source_note").notNull().default(""),
    condition: productCondition("condition").notNull().default("new"),
    /** Түрээс: хоосон бол түрээслэх боломжгүй. */
    rentalPricePerDayMnt: integer("rental_price_per_day_mnt"),
    rentalDepositMnt: integer("rental_deposit_mnt"),
    rentalTerms: text("rental_terms").notNull().default(""),
    /** Цэвэрлэгээ, ариутгалын мэдээлэл ба аюулгүй байдлын шалгалт (түрээс, хуучин бүтээгдэхүүнд заавал бөглөх). */
    sanitationInfo: text("sanitation_info").notNull().default(""),
    safetyInspectionInfo: text("safety_inspection_info").notNull().default(""),
    categoryId: integer("category_id")
      .notNull()
      .references(() => categories.id),
    status: productStatus("status").notNull().default("draft"),
    isFeatured: boolean("is_featured").notNull().default(false),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index("products_category_idx").on(t.categoryId),
    index("products_status_idx").on(t.status),
    check("products_price_nonneg", sql`${t.priceMnt} >= 0`),
    check("products_stock_nonneg", sql`${t.stock} >= 0`),
  ],
);

export const productImages = pgTable(
  "product_images",
  {
    id: serial("id").primaryKey(),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    url: text("url").notNull(),
    /** Дэлгэц уншигчид зориулсан тайлбар — заавал. */
    alt: text("alt").notNull(),
    /** AI-аар бүтээсэн зураг бол бодит зураг мэт харуулахгүй, тэмдэглэнэ. */
    isAiGenerated: boolean("is_ai_generated").notNull().default(false),
    credit: text("credit").notNull().default(""),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (t) => [index("product_images_product_idx").on(t.productId)],
);

export const inventoryReason = pgEnum("inventory_reason", ["order", "order_cancelled", "admin_adjust"]);
export const inventoryMovements = pgTable("inventory_movements", {
  id: serial("id").primaryKey(),
  productId: uuid("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),
  delta: integer("delta").notNull(),
  reason: inventoryReason("reason").notNull(),
  orderId: uuid("order_id"),
  actorId: uuid("actor_id").references(() => users.id, { onDelete: "set null" }),
  createdAt: createdAt(),
});

// ───────────────────────── Сагс, хадгалах жагсаалт ─────────────────────────

export const carts = pgTable("carts", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .unique()
    .references(() => users.id, { onDelete: "cascade" }),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const cartItems = pgTable(
  "cart_items",
  {
    cartId: uuid("cart_id")
      .notNull()
      .references(() => carts.id, { onDelete: "cascade" }),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    quantity: integer("quantity").notNull(),
    addedAt: createdAt(),
  },
  (t) => [primaryKey({ columns: [t.cartId, t.productId] }), check("cart_qty_pos", sql`${t.quantity} > 0`)],
);

export const wishlistItems = pgTable(
  "wishlist_items",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    createdAt: createdAt(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.productId] })],
);

// ───────────────────────── Захиалга, төлбөр, хүргэлт ─────────────────────────

export const deliveryMethods = pgTable("delivery_methods", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  feeMnt: integer("fee_mnt").notNull().default(0),
  estimatedTime: text("estimated_time").notNull().default(""),
  requiresAddress: boolean("requires_address").notNull().default(true),
  isActive: boolean("is_active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: createdAt(),
});

export const orderStatus = pgEnum("order_status", [
  "created", // Үүссэн
  "confirmed", // Баталгаажсан
  "processing", // Боловсруулагдаж байгаа
  "shipped", // Хүргэлтэд гарсан
  "delivered", // Хүргэгдсэн
  "cancelled", // Цуцлагдсан
]);

export const paymentMethod = pgEnum("payment_method", ["cash_on_delivery", "bank_transfer", "qpay"]);
export const paymentStatus = pgEnum("payment_status", ["pending", "paid", "failed", "refunded", "cancelled"]);
export const contactPreference = pgEnum("contact_preference", ["in_app", "sms", "email", "phone_call", "video_call"]);

export const orders = pgTable(
  "orders",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orderNumber: text("order_number").notNull().unique(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    status: orderStatus("status").notNull().default("created"),
    contactName: text("contact_name").notNull(),
    contactPhone: text("contact_phone").notNull(),
    contactEmail: text("contact_email"),
    contactPreference: contactPreference("contact_preference").notNull().default("in_app"),
    city: text("city"),
    district: text("district"),
    khoroo: text("khoroo"),
    addressLine: text("address_line"),
    addressNote: text("address_note"),
    deliveryMethodId: integer("delivery_method_id").references(() => deliveryMethods.id, { onDelete: "set null" }),
    deliveryMethodName: text("delivery_method_name").notNull(),
    deliveryFeeMnt: integer("delivery_fee_mnt").notNull(),
    subtotalMnt: integer("subtotal_mnt").notNull(),
    totalMnt: integer("total_mnt").notNull(),
    paymentMethod: paymentMethod("payment_method").notNull(),
    customerNote: text("customer_note"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("orders_user_idx").on(t.userId), index("orders_status_idx").on(t.status)],
);

export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: uuid("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  productId: uuid("product_id").references(() => products.id, { onDelete: "set null" }),
  productName: text("product_name").notNull(),
  unitPriceMnt: integer("unit_price_mnt").notNull(),
  quantity: integer("quantity").notNull(),
});

export const orderStatusHistory = pgTable("order_status_history", {
  id: serial("id").primaryKey(),
  orderId: uuid("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  status: orderStatus("status").notNull(),
  note: text("note"),
  actorId: uuid("actor_id").references(() => users.id, { onDelete: "set null" }),
  createdAt: createdAt(),
});

/** Төлбөрийн картын мэдээллийг ХЭЗЭЭ Ч хадгалахгүй. Зөвхөн төлөв, дүн, үйлчилгээний лавлах дугаар. */
export const payments = pgTable("payments", {
  id: uuid("id").primaryKey().defaultRandom(),
  orderId: uuid("order_id")
    .notNull()
    .unique()
    .references(() => orders.id, { onDelete: "cascade" }),
  method: paymentMethod("method").notNull(),
  status: paymentStatus("status").notNull().default("pending"),
  amountMnt: integer("amount_mnt").notNull(),
  providerRef: text("provider_ref"),
  /** Гараар баталгаажуулсан бол хэн, хэзээ. */
  verifiedBy: uuid("verified_by").references(() => users.id, { onDelete: "set null" }),
  verifiedAt: timestamp("verified_at", { withTimezone: true }),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const deliveryStatus = pgEnum("delivery_status", ["pending", "out_for_delivery", "delivered", "failed"]);
export const deliveries = pgTable("deliveries", {
  id: uuid("id").primaryKey().defaultRandom(),
  orderId: uuid("order_id")
    .notNull()
    .unique()
    .references(() => orders.id, { onDelete: "cascade" }),
  status: deliveryStatus("status").notNull().default("pending"),
  trackingInfo: text("tracking_info"),
  updatedAt: updatedAt(),
});

export const reviewStatus = pgEnum("review_status", ["published", "hidden"]);
/** Зөвхөн тухайн бүтээгдэхүүнийг хүлээн авсан (delivered) худалдан авагч үнэлгээ бичнэ. */
export const reviews = pgTable(
  "reviews",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    rating: integer("rating").notNull(),
    body: text("body").notNull(),
    status: reviewStatus("status").notNull().default("published"),
    createdAt: createdAt(),
  },
  (t) => [
    uniqueIndex("reviews_user_product").on(t.userId, t.productId),
    check("reviews_rating_range", sql`${t.rating} between 1 and 5`),
  ],
);

// ───────────────────────── Үйлчилгээ (V үе шат) ─────────────────────────

export const serviceCategory = pgEnum("service_category", [
  "rehabilitation", // Сэргээн засах
  "equipment_repair", // Тоног төхөөрөмжийн засвар
  "wheelchair_repair", // Тэргэнцэр, туслах төхөөрөмжийн засвар
  "home_assistance", // Гэрийн туслах
  "accessible_transport", // Хүртээмжтэй тээвэр
  "sign_language", // Дохионы хэлний орчуулагч
  "accessibility_consulting", // Хүртээмжийн зөвлөгөө
  "caregiving", // Асран хамгаалагчийн үйлчилгээ
]);

export const serviceProviders = pgTable("service_providers", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  phone: text("phone"),
  email: text("email"),
  address: text("address"),
  /** Админ бичиг баримтыг шалгасны дараа л true. */
  verified: boolean("verified").notNull().default(false),
  verifiedAt: timestamp("verified_at", { withTimezone: true }),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: createdAt(),
});

export const serviceListings = pgTable("service_listings", {
  id: uuid("id").primaryKey().defaultRandom(),
  providerId: uuid("provider_id")
    .notNull()
    .references(() => serviceProviders.id, { onDelete: "cascade" }),
  category: serviceCategory("category").notNull(),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  priceMnt: integer("price_mnt"),
  priceTerms: text("price_terms").notNull().default(""),
  location: text("location").notNull().default(""),
  schedule: text("schedule").notNull().default(""),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: createdAt(),
});

export const bookingStatus = pgEnum("booking_status", ["requested", "confirmed", "completed", "cancelled", "rejected"]);
export const serviceBookings = pgTable("service_bookings", {
  id: uuid("id").primaryKey().defaultRandom(),
  listingId: uuid("listing_id")
    .notNull()
    .references(() => serviceListings.id, { onDelete: "cascade" }),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  requestedAt: timestamp("requested_at", { withTimezone: true }).notNull(),
  note: text("note"),
  contactPreference: contactPreference("contact_preference").notNull().default("in_app"),
  status: bookingStatus("status").notNull().default("requested"),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

// ───────────────────────── Хүртээмжтэй газрын сан (V үе шат) ─────────────────────────

export const placeType = pgEnum("place_type", [
  "hospital",
  "pharmacy",
  "restaurant",
  "shop",
  "government",
  "bank",
  "education",
  "leisure",
]);
export const verificationStatus = pgEnum("verification_status", ["unverified", "community_reported", "verified"]);
export const featureValue = pgEnum("feature_value", ["yes", "partial", "no", "unknown"]);
export const placeFeature = pgEnum("place_feature", [
  "ramp",
  "elevator",
  "wheelchair_entrance",
  "accessible_toilet",
  "visual_accessibility",
  "hearing_accessibility",
  "accessible_parking",
]);

export const accessiblePlaces = pgTable("accessible_places", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  type: placeType("type").notNull(),
  address: text("address").notNull(),
  district: text("district"),
  latitude: doublePrecision("latitude"),
  longitude: doublePrecision("longitude"),
  description: text("description").notNull().default(""),
  source: text("source").notNull().default(""),
  verificationStatus: verificationStatus("verification_status").notNull().default("unverified"),
  lastVerifiedAt: timestamp("last_verified_at", { withTimezone: true }),
  submittedBy: uuid("submitted_by").references(() => users.id, { onDelete: "set null" }),
  isPublished: boolean("is_published").notNull().default(false),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const accessibilityFeatures = pgTable(
  "accessibility_features",
  {
    placeId: uuid("place_id")
      .notNull()
      .references(() => accessiblePlaces.id, { onDelete: "cascade" }),
    feature: placeFeature("feature").notNull(),
    value: featureValue("value").notNull().default("unknown"),
    note: text("note"),
  },
  (t) => [primaryKey({ columns: [t.placeId, t.feature] })],
);

export const placePhotos = pgTable("place_photos", {
  id: serial("id").primaryKey(),
  placeId: uuid("place_id")
    .notNull()
    .references(() => accessiblePlaces.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  alt: text("alt").notNull(),
  credit: text("credit").notNull().default(""),
});

export const suggestionStatus = pgEnum("suggestion_status", ["new", "accepted", "rejected"]);
export const placeEditSuggestions = pgTable("place_edit_suggestions", {
  id: uuid("id").primaryKey().defaultRandom(),
  placeId: uuid("place_id").references(() => accessiblePlaces.id, { onDelete: "cascade" }),
  userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
  body: text("body").notNull(),
  status: suggestionStatus("status").notNull().default("new"),
  createdAt: createdAt(),
});

// ───────────────────────── Ажил, сургалт (V үе шат) ─────────────────────────

export const jobStatus = pgEnum("job_status", ["pending_review", "published", "closed", "rejected"]);
export const jobs = pgTable("jobs", {
  id: uuid("id").primaryKey().defaultRandom(),
  employerId: uuid("employer_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  organization: text("organization").notNull(),
  description: text("description").notNull(),
  location: text("location").notNull().default(""),
  isRemote: boolean("is_remote").notNull().default(false),
  salaryInfo: text("salary_info").notNull().default(""),
  accessibilityInfo: text("accessibility_info").notNull().default(""),
  applyDeadline: timestamp("apply_deadline", { withTimezone: true }),
  /** Ажил олгогчийн бүртгэлийг админ шалгасан эсэх. */
  employerVerified: boolean("employer_verified").notNull().default(false),
  status: jobStatus("status").notNull().default("pending_review"),
  createdAt: createdAt(),
});

export const applicationStatus = pgEnum("application_status", ["submitted", "reviewed", "accepted", "rejected", "withdrawn"]);
export const jobApplications = pgTable(
  "job_applications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    jobId: uuid("job_id")
      .notNull()
      .references(() => jobs.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    coverLetter: text("cover_letter").notNull(),
    cv: text("cv"),
    status: applicationStatus("status").notNull().default("submitted"),
    createdAt: createdAt(),
  },
  (t) => [uniqueIndex("job_applications_once").on(t.jobId, t.userId)],
);

// ───────────────────────── Нийгэмлэг ─────────────────────────

export const postType = pgEnum("post_type", ["question", "experience", "event", "training", "volunteer", "info", "feedback"]);
export const moderationStatus = pgEnum("moderation_status", ["pending", "published", "hidden", "removed"]);

export const communityPosts = pgTable("community_posts", {
  id: uuid("id").primaryKey().defaultRandom(),
  authorId: uuid("author_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  type: postType("type").notNull(),
  title: text("title").notNull(),
  body: text("body").notNull(),
  status: moderationStatus("status").notNull().default("pending"),
  createdAt: createdAt(),
});

export const communityReplies = pgTable("community_replies", {
  id: uuid("id").primaryKey().defaultRandom(),
  postId: uuid("post_id")
    .notNull()
    .references(() => communityPosts.id, { onDelete: "cascade" }),
  authorId: uuid("author_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  body: text("body").notNull(),
  status: moderationStatus("status").notNull().default("published"),
  createdAt: createdAt(),
});

export const reportStatus = pgEnum("report_status", ["new", "reviewing", "resolved", "dismissed"]);
/** Гомдол: доромжлол, залилан, буруу эмчилгээний зөвлөгөө, хувийн мэдээлэл задруулсан гэх мэт. */
export const contentReports = pgTable("content_reports", {
  id: uuid("id").primaryKey().defaultRandom(),
  reporterId: uuid("reporter_id").references(() => users.id, { onDelete: "set null" }),
  targetType: text("target_type").notNull(),
  targetId: text("target_id").notNull(),
  reason: text("reason").notNull(),
  details: text("details"),
  status: reportStatus("status").notNull().default("new"),
  createdAt: createdAt(),
});

// ───────────────────────── Хөнгөлөлт, дэмжлэгийн хөтөлбөр ─────────────────────────

export const supportPrograms = pgTable("support_programs", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  organization: text("organization").notNull(),
  description: text("description").notNull(),
  conditions: text("conditions").notNull().default(""),
  howToApply: text("how_to_apply").notNull().default(""),
  /** Албан ёсны эх сурвалжийн холбоос — заавал. */
  officialSourceUrl: text("official_source_url").notNull(),
  validFrom: timestamp("valid_from", { withTimezone: true }),
  validTo: timestamp("valid_to", { withTimezone: true }),
  verificationStatus: verificationStatus("verification_status").notNull().default("unverified"),
  lastVerifiedAt: timestamp("last_verified_at", { withTimezone: true }),
  isPublished: boolean("is_published").notNull().default(false),
  createdAt: createdAt(),
});

// ───────────────────────── Тусламж хүсэх ─────────────────────────

export const supportType = pgEnum("support_type", [
  "product_choice", // Бүтээгдэхүүн сонгоход тусламж
  "order_question", // Захиалгын талаар асуух
  "place_visit", // Үйлчилгээний газар очиход тусламж
  "device_repair", // Туслах төхөөрөмжийн засвар
  "communication", // Харилцааны туслах үйлчилгээ
  "website_accessibility", // Вэбсайтын хүртээмжийн асуудал мэдээлэх
  "other",
]);
export const supportStatus = pgEnum("support_status", ["new", "in_progress", "waiting_customer", "resolved", "closed"]);

export const supportRequests = pgTable(
  "support_requests",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    referenceNumber: text("reference_number").notNull().unique(),
    userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
    type: supportType("type").notNull(),
    subject: text("subject").notNull(),
    message: text("message").notNull(),
    contactName: text("contact_name").notNull(),
    contactPreference: contactPreference("contact_preference").notNull(),
    contactValue: text("contact_value"),
    /** Холбоо барих мэдээллээ ажилтанд харуулахыг зөвшөөрсөн эсэх. */
    shareConsent: boolean("share_consent").notNull().default(false),
    orderId: uuid("order_id").references(() => orders.id, { onDelete: "set null" }),
    status: supportStatus("status").notNull().default("new"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("support_user_idx").on(t.userId)],
);

/** Бичгэн харилцаа (чат) — сонсголгүй хэрэглэгч дуудлагагүйгээр тусламж авна. */
export const supportMessages = pgTable("support_messages", {
  id: serial("id").primaryKey(),
  requestId: uuid("request_id")
    .notNull()
    .references(() => supportRequests.id, { onDelete: "cascade" }),
  authorId: uuid("author_id").references(() => users.id, { onDelete: "set null" }),
  isStaff: boolean("is_staff").notNull().default(false),
  body: text("body").notNull(),
  createdAt: createdAt(),
});

// ───────────────────────── Мэдэгдэл, аудит, тохиргоо ─────────────────────────

export const notifications = pgTable(
  "notifications",
  {
    id: serial("id").primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    body: text("body").notNull(),
    link: text("link"),
    readAt: timestamp("read_at", { withTimezone: true }),
    createdAt: createdAt(),
  },
  (t) => [index("notifications_user_idx").on(t.userId)],
);

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: serial("id").primaryKey(),
    actorId: uuid("actor_id").references(() => users.id, { onDelete: "set null" }),
    action: text("action").notNull(),
    entityType: text("entity_type").notNull(),
    entityId: text("entity_id"),
    details: jsonb("details").$type<Record<string, unknown>>(),
    createdAt: createdAt(),
  },
  (t) => [index("audit_created_idx").on(t.createdAt)],
);

/** Serverless орчинд ажиллах хялбар rate limit (fixed window). */
export const rateLimits = pgTable("rate_limits", {
  key: text("key").primaryKey(),
  windowStart: timestamp("window_start", { withTimezone: true }).notNull(),
  count: integer("count").notNull(),
});

/** Нүүр хуудасны контент, AI туслахын тохиргоо гэх мэт key-value. */
export const siteSettings = pgTable("site_settings", {
  key: text("key").primaryKey(),
  value: jsonb("value").notNull(),
  updatedAt: updatedAt(),
});
