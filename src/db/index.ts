import "server-only";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";
import { resolveDatabaseUrl } from "./url";

const url = resolveDatabaseUrl();
if (!url) throw new Error("DATABASE_URL тохируулаагүй байна (.env.example-г үзнэ үү).");

// Dev hot-reload үед холболт давхардахгүй байх.
const globalForDb = globalThis as unknown as { pgClient?: ReturnType<typeof postgres> };
const client =
  globalForDb.pgClient ??
  postgres(url, {
    max: process.env.VERCEL ? 1 : 10,
    // Neon/Supabase-ийн pooler (transaction mode)-тэй нийцүүлэх.
    prepare: false,
  });
if (process.env.NODE_ENV !== "production") globalForDb.pgClient = client;

export const db = drizzle(client, { schema });
export type DB = typeof db;
export type Tx = Parameters<Parameters<DB["transaction"]>[0]>[0];
export { schema };
