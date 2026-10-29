import { expect, test } from "@playwright/test";
import { ADMIN, expectNoA11yViolations, login } from "./helpers";

/**
 * Бодит худалдааны урсгал. Туршилтын бүтээгдэхүүн зөвхөн TEST өгөгдлийн санд үүснэ, "Туршилт" гэж нэрлэсэн.
 * Админ → хүргэлт, бүтээгдэхүүн үүсгэх → худалдан авагч бүртгүүлэх, сагс, захиалга → админ боловсруулах → хүргэгдсэн → үнэлгээ.
 */
test.describe.serial("худалдааны бүрэн урсгал", () => {
  const customer = { name: "Туршилтын хэрэглэгч", email: `buyer-${Date.now()}@example.com`, password: "Buyer-pass-12345" };
  let productSlug = "";

  test("админ хүргэлтийн төрөл болон бүтээгдэхүүн нэмнэ", async ({ page }) => {
    await login(page, ADMIN.email, ADMIN.password);
    await page.waitForURL("/");

    await page.goto("/admin/delivery");
    await page.getByRole("button", { name: "Хадгалах" }).first().waitFor();
    const form = page.locator("form").filter({ hasText: "Хаяг шаардлагатай" }).first();
    await form.getByLabel("Нэр").fill("Туршилтын хүргэлт");
    await form.getByLabel(/Хүргэлтийн төлбөр/).fill("5000");
    await form.getByLabel("Хугацаа").fill("1-2 өдөр");
    await form.getByRole("button", { name: "Хадгалах" }).click();
    await expect(page.getByText("Хүргэлтийн төрөл хадгалагдлаа.").first()).toBeVisible();

    await page.goto("/admin/products/new");
    await page.getByLabel(/^Нэр \(Монголоор\)/).fill("Туршилтын тэргэнцэр");
    await page.getByLabel(/^Ангилал/).selectOption({ index: 1 });
    await page.getByLabel(/^Товч тайлбар/).fill("Зөвхөн автомат тестэд зориулсан туршилтын бүтээгдэхүүн.");
    await page.getByLabel(/^Үнэ \(төгрөг\)/).fill("250000");
    await page.getByLabel(/^Нөөцийн тоо/).fill("2");
    await page.getByLabel(/^Нийтлэлийн төлөв/).selectOption("published");
    await page.getByRole("button", { name: "Хадгалах" }).click();
    await page.waitForURL(/\/admin\/products\/[0-9a-f-]{36}\?saved=1/);
    await expect(page.getByRole("status").filter({ hasText: "Бүтээгдэхүүн үүслээ." })).toBeVisible();
    const href = await page.getByRole("link", { name: "Сайт дээр харах" }).getAttribute("href");
    productSlug = href!.replace("/products/", "");
  });

  test("зочин админы хэсэгт орж чадахгүй", async ({ page }) => {
    await page.goto("/admin/products");
    await expect(page).toHaveURL(/\/login/);
  });

  test("хэрэглэгч бүртгүүлж, хайж, сагслаж, захиалга өгнө", async ({ page }) => {
    // Хайлт
    await page.goto("/");
    await page.locator("#home-search").fill("тэргэнцэр");
    await page.getByRole("button", { name: "Хайх", exact: true }).click();
    await expect(page.getByRole("heading", { name: /хайлтын үр дүн/ }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: "Туршилтын тэргэнцэр" })).toBeVisible();
    await expectNoA11yViolations(page, "хайлтын үр дүн");

    // Дэлгэрэнгүй, сагс (зочин байхдаа)
    await page.getByRole("link", { name: "Туршилтын тэргэнцэр" }).click();
    await expect(page.getByRole("heading", { level: 1, name: "Туршилтын тэргэнцэр" })).toBeVisible();
    await expect(page.getByText("Үнэ баталгаажаагүй").first()).toBeVisible();
    await expectNoA11yViolations(page, "бүтээгдэхүүний дэлгэрэнгүй");
    await page.getByLabel("Тоо ширхэг").selectOption("2");
    await page.getByRole("button", { name: /^Сагсанд нэмэх/ }).click();
    await expect(page.getByRole("status").filter({ hasText: "сагсанд нэмэгдлээ" })).toBeVisible();

    // Нөөцөөс хэтрүүлэх боломжгүй
    await page.getByRole("button", { name: /^Сагсанд нэмэх/ }).click();
    await expect(page.getByRole("status").filter({ hasText: "хязгаарлав" })).toBeVisible();

    // Сагс
    await page.goto("/cart");
    await expect(page.getByRole("heading", { name: "Туршилтын тэргэнцэр" })).toBeVisible();
    await expectNoA11yViolations(page, "сагс");

    // Сагснаас хасаад буцаах
    await page.getByRole("button", { name: /^Хасах Туршилтын тэргэнцэр/ }).click();
    await expect(page.getByText("сагснаас хасагдлаа")).toBeVisible();
    await page.getByRole("button", { name: /Буцаах/ }).click();
    await expect(page.getByRole("heading", { name: "Туршилтын тэргэнцэр" })).toBeVisible();

    // Захиалга өгөхөд нэвтрэх шаардлагатай → бүртгүүлнэ
    await page.getByRole("link", { name: "Захиалга өгөх" }).click();
    await expect(page).toHaveURL(/\/login\?next=%2Fcheckout/);
    await page.getByRole("link", { name: "шинээр бүртгүүлэх" }).click();

    // Бүртгэлийн маягтын алдааны мэдэгдэл
    await page.getByRole("button", { name: "Бүртгүүлэх" }).click();
    const alert = page.locator("form [role=alert]");
    await expect(alert).toBeVisible();
    await expect(alert).toBeFocused();
    await expect(alert).toContainText("Маягтад");
    await expectNoA11yViolations(page, "бүртгэлийн алдаатай маягт");

    await page.getByLabel(/^Нэр \*/).fill(customer.name);
    await page.getByLabel("Имэйл хаяг").fill(customer.email);
    await page.getByLabel("Утасны дугаар").fill("99112233");
    await page.getByLabel(/^Нууц үг \*/).fill(customer.password);
    await page.getByLabel("Нууц үг давтах").fill(customer.password);
    await page.getByLabel(/Үйлчилгээний нөхцөл/).check();
    await page.getByRole("button", { name: "Бүртгүүлэх" }).click();

    // Зочны сагс бүртгэлд шилжсэн, checkout руу буцсан
    await page.waitForURL("/checkout");
    await expect(page.getByText("Туршилтын тэргэнцэр × 2")).toBeVisible();
    await expectNoA11yViolations(page, "checkout");

    await page.getByRole("button", { name: "Захиалга баталгаажуулах" }).click();
    await expect(page.locator("form [role=alert]")).toContainText("алдаа");

    await page.getByLabel("Дэлгэрэнгүй хаяг").fill("1-р хороолол, 12-р байр, 34 тоот");
    await page.getByLabel(/Захиалгын мэдээллээ шалгасан/).check();
    await page.getByRole("button", { name: "Захиалга баталгаажуулах" }).click();

    await page.waitForURL(/\/orders\/[0-9a-f-]{36}\?placed=1/);
    await expect(page.getByText("Захиалга амжилттай бүртгэгдлээ")).toBeVisible();
    // Бодит төлбөр холбогдоогүй тул "төлөгдсөн" гэж хэзээ ч харуулахгүй
    await expect(page.getByText("Төлөгдөөгүй (хүлээгдэж байна)")).toBeVisible();
    await expect(page.getByText("Төлөгдсөн", { exact: true })).toHaveCount(0);
    await expectNoA11yViolations(page, "захиалгын хуудас");
  });

  test("нөөц хасагдсан тул өөр хэрэглэгч захиалах боломжгүй", async ({ page }) => {
    await page.goto(`/products/${productSlug}`);
    await expect(page.getByText(/^Дууссан/)).toBeVisible();
    await expect(page.getByRole("button", { name: /^Сагсанд нэмэх/ })).toHaveCount(0);
  });

  test("админ захиалгыг боловсруулна, төлбөрийг гараар баталгаажуулна", async ({ page }) => {
    await login(page, ADMIN.email, ADMIN.password);
    await page.goto("/admin/orders");
    await page.getByRole("link", { name: /^ZH-/ }).first().click();
    await expectNoA11yViolations(page, "админ захиалга");

    const statusForm = page.locator("form[aria-label='Захиалгын төлөв өөрчлөх']");
    for (const [value, label] of [["confirmed", "Баталгаажсан"], ["processing", "Боловсруулагдаж байгаа"], ["shipped", "Хүргэлтэд гарсан"], ["delivered", "Хүргэгдсэн"]] as const) {
      await statusForm.getByLabel(/^Шинэ төлөв/).selectOption(value);
      await statusForm.getByRole("button", { name: "Төлөв шинэчлэх" }).click();
      await expect(page.getByText("Захиалгын төлөв шинэчлэгдлээ").first()).toBeVisible();
      await expect(page.getByText(`Төлөв: ${label}`)).toBeVisible();
      await page.reload();
    }
    const pay = page.locator("form[aria-label='Төлбөрийн төлөв']");
    await pay.getByLabel(/Төлбөрийн төлөв/).selectOption("paid");
    await pay.getByRole("button", { name: "Хадгалах" }).click();
    await expect(page.getByText("Төлбөрийн төлөв шинэчлэгдлээ.")).toBeVisible();
  });

  test("хэрэглэгч мэдэгдэл хүлээн авч, үнэлгээ бичнэ", async ({ page }) => {
    await login(page, customer.email, customer.password);
    await page.goto("/account/notifications");
    await expect(page.getByText(/Хүргэгдсэн/).first()).toBeVisible();
    await expectNoA11yViolations(page, "мэдэгдлүүд");

    await page.goto(`/products/${productSlug}`);
    await page.getByLabel(/5 — Маш сайн/).check();
    await page.getByLabel(/^Сэтгэгдэл/).fill("Туршилтын үнэлгээ — хүргэлт болон бүтээгдэхүүн тохирсон.");
    await page.getByRole("button", { name: "Үнэлгээ илгээх" }).click();
    await expect(page.getByText("Таны үнэлгээ нийтлэгдлээ")).toBeVisible();
  });

  test("энгийн хэрэглэгч админ руу орж чадахгүй, өөр хэрэглэгчийн захиалгыг харахгүй", async ({ page }) => {
    await login(page, customer.email, customer.password);
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/forbidden/);
    await page.goto("/orders/00000000-0000-4000-8000-000000000000");
    await expect(page.getByRole("heading", { name: "Хуудас олдсонгүй" })).toBeVisible();
  });

  test("хүртээмжийн тохиргоо нэвтрэх бүрт хадгалагдана", async ({ page }) => {
    await login(page, customer.email, customer.password);
    await page.goto("/settings/accessibility");
    await page.getByLabel("Том (≈120%)").check();
    await page.getByLabel("Том товчлуур").check();
    await page.getByRole("button", { name: "Тохиргоо хадгалах" }).click();
    await expect(page.getByText("Дараа нэвтрэхэд автоматаар хэрэгжинэ")).toBeVisible();
    await page.context().clearCookies();
    await login(page, customer.email, customer.password);
    await page.goto("/");
    await expect(page.locator("html")).toHaveAttribute("data-font", "large");
    await expect(page.locator("html")).toHaveAttribute("data-targets", "large");
  });

  test("гарын удирдлага: skip link болон Tab-аар шилжилт", async ({ page }) => {
    await page.goto("/");
    await page.keyboard.press("Tab");
    await expect(page.getByRole("link", { name: "Үндсэн агуулга руу шилжих" })).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/#main$/);
  });
});
