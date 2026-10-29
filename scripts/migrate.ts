import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import { resolveDatabaseUrl } from "../src/db/url";

async function main() {
  const url = resolveDatabaseUrl(true);
  if (!url) throw new Error("DATABASE_URL тохируулаагүй");
  const client = postgres(url, { max: 1, onnotice: () => {} });
  await migrate(drizzle(client), { migrationsFolder: "./drizzle" });
  await client.end();
  console.log("Migration амжилттай.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
