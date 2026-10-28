import { z } from "zod";

/** Нийтлэг талбарууд — алдааны мэдэгдэл бүр Монгол хэлээр, юуг яаж засахыг хэлнэ. */
export const req = (label: string, max = 200) =>
  z
    .string({ required_error: `${label} оруулна уу.` })
    .trim()
    .min(1, `${label} оруулна уу.`)
    .max(max, `${label} ${max} тэмдэгтээс хэтрэхгүй байх ёстой.`);

export const opt = (max = 2000) =>
  z
    .string()
    .trim()
    .max(max, `${max} тэмдэгтээс хэтрэхгүй байх ёстой.`)
    .optional()
    .transform((v) => (v ? v : undefined));

export const email = z
  .string({ required_error: "Имэйл хаягаа оруулна уу." })
  .trim()
  .toLowerCase()
  .min(1, "Имэйл хаягаа оруулна уу.")
  .max(200, "Имэйл хаяг хэт урт байна.")
  .email("Имэйл хаяг буруу байна. Жишээ: name@example.com");

/** Монгол утасны дугаар: 8 оронтой, +976 байж болно. */
export const phone = z
  .string({ required_error: "Утасны дугаараа оруулна уу." })
  .trim()
  .transform((v) => v.replace(/[\s-]/g, "").replace(/^\+?976/, ""))
  .pipe(z.string().regex(/^[0-9]{8}$/, "Утасны дугаар 8 оронтой тоо байх ёстой. Жишээ: 99112233"));

export const password = z
  .string({ required_error: "Нууц үгээ оруулна уу." })
  .min(10, "Нууц үг дор хаяж 10 тэмдэгт байх ёстой.")
  .max(200, "Нууц үг хэт урт байна.");

export const checkbox = z
  .union([z.literal("on"), z.literal("true"), z.literal("1"), z.undefined(), z.null()])
  .transform((v) => v === "on" || v === "true" || v === "1");

export const intMnt = (label: string) =>
  z.coerce
    .number({ invalid_type_error: `${label} тоо байх ёстой.` })
    .int(`${label} бүхэл тоо байх ёстой.`)
    .min(0, `${label} сөрөг байж болохгүй.`)
    .max(1_000_000_000, `${label} хэт их байна.`);

export const httpsUrl = z
  .string()
  .trim()
  .url("Зөв холбоос оруулна уу (https://-ээр эхэлсэн).")
  .refine((u) => u.startsWith("https://"), "Зөвхөн https:// холбоос зөвшөөрнө.");
