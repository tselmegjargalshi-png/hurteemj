/** Анхны администраторыг ADMIN_EMAIL / ADMIN_PASSWORD / ADMIN_NAME орчны хувьсагчаас үүсгэнэ. */
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { resolveDatabaseUrl } from "../src/db/url";
import { users } from "../src/db/schema";

async function main() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  const name = process.env.ADMIN_NAME?.trim() || "Администратор";
  if (!email || !password) throw new Error("ADMIN_EMAIL болон ADMIN_PASSWORD тохируулна уу.");
  if (password.length < 10) throw new Error("Нууц үг дор хаяж 10 тэмдэгт байх ёстой.");

  const client = postgres(resolveDatabaseUrl(true)!, { max: 1 });
  const db = drizzle(client);
  const passwordHash = await bcrypt.hash(password, 12);
  const existing = await db.select({ id: users.id }).from(users).where(eq(users.email, email));
  if (existing.length) {
    await db.update(users).set({ role: "admin", passwordHash, name }).where(eq(users.email, email));
    console.log(`Админ шинэчлэгдлээ: ${email}`);
  } else {
    await db.insert(users).values({ email, passwordHash, name, role: "admin" });
    console.log(`Админ үүслээ: ${email}`);
  }
  await client.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
