import { execSync } from "node:child_process";
import postgres from "postgres";

/** Туршилтын өгөгдлийн санг цэвэрлэж, migration + ангилал + админ үүсгэнэ. Зөвхөн TEST өгөгдлийн сан дээр ажиллана. */
async function globalSetup() {
  const url = process.env.TEST_DATABASE_URL ?? "postgres://postgres@localhost:5432/hurteemj_test";
  if (!/test/.test(new URL(url).pathname)) throw new Error("Туршилтын DB нэрэнд 'test' агуулагдах ёстой — production өгөгдөл устгахаас сэргийлнэ.");
  const sql = postgres(url, { max: 1, onnotice: () => {} });
  await sql`drop schema if exists public cascade`;
  await sql`drop schema if exists drizzle cascade`;
  await sql`create schema public`;
  await sql.end();
  const env = { ...process.env, DATABASE_URL: url, ADMIN_EMAIL: "admin-e2e@example.com", ADMIN_PASSWORD: "E2e-admin-pass-1!", ADMIN_NAME: "Туршилтын админ" };
  execSync("npm run -s db:migrate && npm run -s db:seed && npm run -s db:create-admin", { env, stdio: "inherit" });
}

globalSetup().catch((e) => {
  console.error(e);
  process.exit(1);
});
