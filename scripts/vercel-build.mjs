// Vercel дээр build хийхийн өмнө DB бэлдэнэ. DATABASE_URL байхгүй бол алгасаж, сайтыг зөвхөн build хийнэ.
import { spawnSync } from "node:child_process";

const run = (cmd, args) => {
  const r = spawnSync(cmd, args, { stdio: "inherit", shell: process.platform === "win32" });
  if (r.status !== 0) process.exit(r.status ?? 1);
};

if (process.env.DATABASE_URL) {
  run("npx", ["tsx", "scripts/migrate.ts"]);
  run("npx", ["tsx", "scripts/seed.ts"]);
  if (process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD) run("npx", ["tsx", "scripts/create-admin.ts"]);
} else {
  console.warn("DATABASE_URL тохируулаагүй тул migration алгаслаа. Сайт өгөгдлийн сангүйгээр ажиллахгүй.");
}
run("npx", ["next", "build"]);
