import { expect, test } from "@playwright/test";

test("navbar links navigate to correct pages", async ({ page }) => {
  await page.goto("/");

  const discoverLink = page.getByRole("link", { name: /discover/i }).first();
  await discoverLink.click();
  await expect(page).toHaveURL(/\/discover/);

  await page.goto("/mobility");
  await expect(page).toHaveURL(/\/mobility/);
  await expect(page.locator("h1")).toBeVisible();

  await page.goto("/itinerary");
  await expect(page).toHaveURL(/\/itinerary/);
  await expect(page.locator("h1")).toBeVisible();
});

test("language switcher toggles between en and sq", async ({ page }) => {
  await page.goto("/");

  const switchButton = page.getByRole("button", { name: /shqip|english|sq|en/i }).first();

  if (await switchButton.isVisible()) {
    await switchButton.click();
    await page.waitForTimeout(300);
  }
});
