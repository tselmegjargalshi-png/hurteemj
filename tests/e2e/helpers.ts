import AxeBuilder from "@axe-core/playwright";
import { expect, type Page } from "@playwright/test";

export const ADMIN = { email: "admin-e2e@example.com", password: "E2e-admin-pass-1!" };

/** WCAG 2.x A/AA дүрмээр axe-core шалгалт. Нэг ч зөрчил байвал унана. */
export async function expectNoA11yViolations(page: Page, label: string) {
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
  const summary = results.violations.map((v) => `${v.id} (${v.impact}): ${v.help} — ${v.nodes.length} элемент, жишээ: ${v.nodes[0]?.target.join(" ")}`);
  expect(summary, `${label}: хүртээмжийн зөрчил`).toEqual([]);
}

export async function login(page: Page, email: string, password: string) {
  await page.goto("/login");
  await page.getByLabel("Имэйл хаяг").fill(email);
  await page.getByLabel("Нууц үг").fill(password);
  await page.getByRole("button", { name: "Нэвтрэх" }).click();
  await page.waitForURL((u) => !u.pathname.startsWith("/login"));
}
