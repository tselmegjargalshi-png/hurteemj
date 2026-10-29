/**
 * Өгөгдлийн сангийн холбоосыг орчноос олно. Vercel-ийн Neon нэгдэл хувьсагчийг төслийн нэрээр угтвар болгож
 * (жишээ нь `Hurteemj_DATABASE_URL`) үүсгэдэг тул `DATABASE_URL`-ийн дараа эдгээрийг шалгана.
 * `unpooled` нь migration-д, pooled нь аппликейшнд.
 */
export function resolveDatabaseUrl(unpooled = false): string | undefined {
  const env = process.env;
  if (env.DATABASE_URL && !unpooled) return env.DATABASE_URL;
  const prefixed = (suffix: string) => Object.entries(env).find(([k, v]) => v && k.endsWith(`_${suffix}`))?.[1];
  const unpooledUrl = prefixed("DATABASE_URL_UNPOOLED") ?? prefixed("POSTGRES_URL_NON_POOLING");
  const pooledUrl = env.DATABASE_URL ?? prefixed("DATABASE_URL") ?? prefixed("POSTGRES_URL");
  return unpooled ? (env.DATABASE_URL_UNPOOLED ?? unpooledUrl ?? pooledUrl) : pooledUrl;
}
