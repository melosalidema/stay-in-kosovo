import { expect, test } from "@playwright/test";

test("homepage loads with hero section and discover link", async ({ page }) => {
  await page.goto("/");

  await expect(page.locator("h1")).toBeVisible();
  await expect(page.getByRole("link", { name: /explore|discover/i }).first()).toBeVisible();
  await expect(page.getByTestId("kosovo-pulse-map")).toBeVisible();
});

test("discover page shows places", async ({ page }) => {
  await page.goto("/discover");

  await expect(page).toHaveURL(/\/discover/);
  await page.waitForTimeout(1000);

  const cards = page.locator('[class*="experience-card"]');
  const count = await cards.count();
  expect(count).toBeGreaterThan(0);
});

test("pulse page renders pulse console", async ({ page }) => {
  await page.goto("/pulse");

  await expect(page.locator("h1")).toBeVisible();
  await page.waitForTimeout(500);
});
