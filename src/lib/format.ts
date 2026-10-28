const mnt = new Intl.NumberFormat("mn-MN", { maximumFractionDigits: 0 });

/** 125000 → "125,000 ₮". Дэлгэц уншигч "₮"-г "төгрөг" гэж уншихгүй байж болох тул formatMntSpoken-г aria-д ашиглана. */
export function formatMnt(value: number): string {
  return `${mnt.format(value)} ₮`;
}

export function formatMntSpoken(value: number): string {
  return `${mnt.format(value)} төгрөг`;
}

const dateFmt = new Intl.DateTimeFormat("mn-MN", { year: "numeric", month: "long", day: "numeric", timeZone: "Asia/Ulaanbaatar" });
const dateTimeFmt = new Intl.DateTimeFormat("mn-MN", {
  year: "numeric",
  month: "long",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Asia/Ulaanbaatar",
});

export function formatDate(d: Date | string): string {
  return dateFmt.format(new Date(d));
}

export function formatDateTime(d: Date | string): string {
  return dateTimeFmt.format(new Date(d));
}

/** Кирилл нэрээс URL-д тохирох slug үүсгэнэ (латин галиглал). */
const translit: Record<string, string> = {
  а: "a", б: "b", в: "v", г: "g", д: "d", е: "ye", ё: "yo", ж: "j", з: "z", и: "i", й: "i", к: "k", л: "l", м: "m",
  н: "n", о: "o", ө: "o", п: "p", р: "r", с: "s", т: "t", у: "u", ү: "u", ф: "f", х: "kh", ц: "ts", ч: "ch", ш: "sh",
  щ: "sh", ъ: "", ы: "y", ь: "", э: "e", ю: "yu", я: "ya",
};

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .split("")
    .map((ch) => translit[ch] ?? ch)
    .join("")
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function pluralItems(n: number): string {
  return `${n} ширхэг`;
}
