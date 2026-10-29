import { test } from "@playwright/test";
import { expectNoA11yViolations } from "./helpers";

// Нэвтрээгүй хэрэглэгчийн нийтийн хуудсууд — axe-core автомат шалгалт.
const PAGES = ["/", "/products", "/categories", "/login", "/register", "/settings/accessibility", "/help", "/cart", "/status", "/accessibility", "/privacy", "/info/payment", "/services", "/not-a-page"];

for (const path of PAGES) {
  test(`axe: ${path}`, async ({ page }) => {
    await page.goto(path);
    await expectNoA11yViolations(page, path);
  });
}

test("axe: өндөр ялгаралтай + том үсэг горим", async ({ page }) => {
  await page.goto("/settings/accessibility");
  await page.getByLabel("Өндөр өнгөний ялгарал").check();
  await page.getByLabel("Маш том (≈140%)").check();
  await page.getByRole("button", { name: "Тохиргоо хадгалах" }).click();
  await page.getByText("Тохиргоо энэ хөтөч дээр хадгалагдлаа").waitFor();
  await page.goto("/");
  await expectNoA11yViolations(page, "/ (high contrast)");
});
