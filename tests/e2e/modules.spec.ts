import { expect, test, type Page } from "@playwright/test";
import { ADMIN, expectNoA11yViolations, login } from "./helpers";

/** V–VI үе шатын модулиуд: үйлчилгээ, газар, ажил, нийгэмлэг, AI туслахын нөөц горим. Өгөгдөл зөвхөн TEST өгөгдлийн санд. */
test.describe.serial("нэмэлт модулиуд", () => {
  const user = { name: "Модуль туршигч", email: `mod-${Date.now()}@example.com`, password: "Module-pass-12345" };

  async function register(page: Page) {
    await page.goto("/register");
    await page.getByLabel(/^Нэр \*/).fill(user.name);
    await page.getByLabel("Имэйл хаяг").fill(user.email);
    await page.getByLabel("Утасны дугаар").fill("99112233");
    await page.getByLabel(/^Нууц үг \*/).fill(user.password);
    await page.getByLabel("Нууц үг давтах").fill(user.password);
    await page.getByLabel(/Үйлчилгээний нөхцөл/).check();
    await page.getByRole("button", { name: "Бүртгүүлэх" }).click();
    await page.waitForURL(/\/account/);
  }

  test("админ үйлчилгээ, газар, хөтөлбөр бүртгэнэ", async ({ page }) => {
    await login(page, ADMIN.email, ADMIN.password);

    await page.goto("/admin/services");
    await page.locator("summary", { hasText: "Шинэ үзүүлэгч нэмэх" }).click();
    let form = page.locator("form[aria-label='Шинэ үйлчилгээ үзүүлэгч']");
    await form.getByLabel(/^Нэр/).fill("Туршилтын үзүүлэгч");
    await form.getByRole("button", { name: "Хадгалах" }).click();
    await expect(page.getByText(/хадгалагдлаа/i).first()).toBeVisible();

    await page.goto("/admin/services");
    await page.locator("summary", { hasText: "Шинэ үйлчилгээ нэмэх" }).click();
    form = page.locator("form[aria-label='Шинэ үйлчилгээ']");
    await form.getByLabel(/^Үйлчилгээ үзүүлэгч/).selectOption({ label: "Туршилтын үзүүлэгч" });
    await form.getByLabel(/^Төрөл/).selectOption({ index: 1 });
    await form.getByLabel(/^Нэр/).fill("Туршилтын үйлчилгээ");
    await form.getByRole("button", { name: "Хадгалах" }).click();
    await expect(page.getByText(/хадгалагдлаа/i).first()).toBeVisible();

    await page.goto("/admin/places");
    await page.locator("summary", { hasText: "Шинэ газар нэмэх" }).click();
    form = page.locator("form[aria-label='Шинэ газар']");
    await form.getByLabel(/^Нэр/).fill("Туршилтын эмнэлэг");
    await form.getByLabel(/^Төрөл/).selectOption({ index: 1 });
    await form.getByLabel(/^Хаяг/).fill("Туршилтын хаяг 1");
    await form.getByLabel(/^Нийтэд харуулах/).check();
    await form.getByRole("button", { name: "Хадгалах" }).click();
    await expect(page.getByText(/хадгалагдлаа/i).first()).toBeVisible();

    for (const p of ["/admin/bookings", "/admin/jobs", "/admin/community", "/admin/programs", "/admin/assistant"]) {
      await page.goto(p);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    }
    await expectNoA11yViolations(page, "/admin/assistant");
  });

  test("хэрэглэгч цаг авч, газрыг харна", async ({ page }) => {
    await page.goto("/places");
    await expect(page.getByRole("link", { name: /Туршилтын эмнэлэг/ })).toBeVisible();
    await page.getByRole("link", { name: /Туршилтын эмнэлэг/ }).click();
    await expect(page.getByText(/Баталгаажаагүй/).first()).toBeVisible();
    await expectNoA11yViolations(page, "газрын дэлгэрэнгүй");

    await register(page);
    await page.goto("/services");
    await page.getByRole("link", { name: "Туршилтын үйлчилгээ" }).click();
    await expectNoA11yViolations(page, "үйлчилгээний дэлгэрэнгүй");
    await page.getByLabel(/^Хүссэн огноо, цаг/).fill("2030-01-15T10:00");
    await page.getByLabel(/^Танд хэрхэн хариу өгөх вэ/).selectOption({ index: 1 });
    await page.getByRole("button", { name: "Хүсэлт илгээх" }).click();
    await expect(page.getByRole("status").filter({ hasText: /илгээгдлээ|илгээлээ/ })).toBeVisible();
    await page.goto("/services/bookings");
    await expect(page.getByText("Туршилтын үйлчилгээ").first()).toBeVisible();
    await expectNoA11yViolations(page, "миний цаг авалт");
  });

  test("нийтлэл модерациар нийтлэгдэнэ", async ({ page, browser }) => {
    await login(page, user.email, user.password);
    await page.goto("/community/new");
    await page.getByLabel(/^Төрөл/).selectOption({ index: 1 });
    await page.getByLabel(/^Гарчиг/).fill("Туршилтын нийтлэл");
    await page.getByLabel(/^Агуулга/).fill("Энэ бол автомат тестийн нийтлэл.");
    await page.getByRole("button", { name: "Хянуулахаар илгээх" }).click();
    await expect(page.getByRole("status").filter({ hasText: /хянасны дараа/ })).toBeVisible();

    // Хянагдах хүртэл нийтэд харагдахгүй
    await page.goto("/community");
    await expect(page.getByText("Туршилтын нийтлэл")).toHaveCount(0);

    const admin = await browser.newPage();
    await login(admin, ADMIN.email, ADMIN.password);
    await admin.goto("/admin/community");
    const item = admin.locator("li", { hasText: "Туршилтын нийтлэл" }).first();
    await item.getByLabel("Төлөв").selectOption("published");
    await item.getByRole("button", { name: "Хадгалах" }).click();
    await expect(admin.getByText(/хадгалагдлаа/i).first()).toBeVisible();
    await admin.close();

    await page.goto("/community");
    await expect(page.getByText("Туршилтын нийтлэл").first()).toBeVisible();
    await expectNoA11yViolations(page, "/community");
  });

  test("ажил олгогч зар нэмнэ, шалгагдтал нийтэд харагдахгүй", async ({ page }) => {
    await login(page, user.email, user.password);
    await page.goto("/jobs/new");
    await page.getByRole("button", { name: "Ажил олгогчоор бүртгүүлэх" }).click();
    await page.getByLabel(/^Ажлын байрны нэр/).waitFor();
    await page.getByLabel(/^Ажлын байрны нэр/).fill("Туршилтын ажил");
    await page.getByLabel(/^Байгууллагын нэр/).fill("Туршилтын байгууллага");
    await page.getByLabel(/^Тайлбар, үүрэг/).fill("Автомат тестийн ажлын зар.");
    await page.getByRole("button", { name: "Шалгуулахаар илгээх" }).click();
    await expect(page.getByRole("status").first()).toBeVisible();
    await page.goto("/jobs");
    await expect(page.getByText("Туршилтын ажил")).toHaveCount(0);
    await page.goto("/jobs/mine");
    await expect(page.getByText("Туршилтын ажил").first()).toBeVisible();
    await page.goto("/jobs/cv");
    await expectNoA11yViolations(page, "/jobs/cv");
  });

  test("AI туслах түлхүүргүй үед энгийн хайлт гэдгээ хэлнэ", async ({ page }) => {
    await page.goto("/assistant");
    await page.getByLabel(/Асуултаа бичнэ үү/).fill("тэргэнцэр");
    await page.getByRole("button", { name: "Асуух" }).click();
    await expect(page.getByText("Энгийн хайлт (AI холбогдоогүй)")).toBeVisible();
  });

  test("асран хамгаалагчийн хуудас нэвтрэлт шаардана", async ({ browser }) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await page.goto("/account/caregivers");
    await expect(page).toHaveURL(/\/login/);
    await ctx.close();
  });
});
