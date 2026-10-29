import { defineConfig } from "@playwright/test";

const PORT = 3100;
const TEST_URL = process.env.TEST_DATABASE_URL ?? "postgres://postgres@localhost:5432/hurteemj_test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  workers: 1,
  timeout: 60_000,
  reporter: [["list"]],
  use: { baseURL: `http://localhost:${PORT}`, locale: "mn-MN" },
  webServer: {
    command: `DATABASE_URL=${TEST_URL} npx tsx tests/e2e/global-setup.ts && npm run build && npx next start -p ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 300_000,
    env: {
      DATABASE_URL: process.env.TEST_DATABASE_URL ?? "postgres://postgres@localhost:5432/hurteemj_test",
      APP_URL: `http://localhost:${PORT}`,
      NODE_ENV: "production",
    },
  },
});
