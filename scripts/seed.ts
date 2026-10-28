/**
 * Seed: ЗӨВХӨН ангиллыг үүсгэнэ.
 * Бүтээгдэхүүн, үнэлгээ, үйлчилгээ үзүүлэгч, ажлын байр зэрэг бодит бус өгөгдөл ҮҮСГЭХГҮЙ —
 * тэдгээрийг админ бодит мэдээллээр нэмнэ.
 */
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { categories } from "../src/db/schema";
import { DEFAULT_CATEGORIES } from "../src/lib/categories";

async function main() {
  const client = postgres(process.env.DATABASE_URL!, { max: 1 });
  const db = drizzle(client);
  for (const [i, c] of DEFAULT_CATEGORIES.entries()) {
    await db
      .insert(categories)
      .values({ ...c, sortOrder: i + 1 })
      .onConflictDoNothing({ target: categories.slug });
  }
  await client.end();
  console.log(`${DEFAULT_CATEGORIES.length} ангилал бэлэн.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
