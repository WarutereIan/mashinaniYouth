import { test, expect } from "@playwright/test";

/**
 * Public surface smoke — no auth required.
 */
test.describe("Public pages", () => {
  test("home loads with brand and auth CTAs", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("link", { name: /log in/i }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: /sign up/i }).first()).toBeVisible();
  });

  test("elections hall loads", async ({ page }) => {
    await page.goto("/elections");
    await expect(page.getByText(/2026 MY-KDM|General Elections|LIVE/i).first()).toBeVisible();
  });

  test("candidates directory loads", async ({ page }) => {
    await page.goto("/candidates");
    await expect(page.getByRole("heading", { name: /meet the|certified/i }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: /apply to vie/i }).first()).toBeVisible();
  });

  test("about page loads", async ({ page }) => {
    await page.goto("/about");
    await expect(page.locator("body")).toContainText(/MY-KDM|Mashinani/i);
  });

  test("auth page shows login and signup tabs", async ({ page }) => {
    await page.goto("/auth");
    await expect(page.getByRole("tab", { name: "Log in" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Sign up" })).toBeVisible();
  });

  test("unauthenticated apply redirects to auth", async ({ page }) => {
    await page.goto("/candidates/apply");
    await page.waitForURL(/\/auth/, { timeout: 20_000 });
    await expect(page).toHaveURL(/redirect=/);
  });

  test("unauthenticated admin redirects to auth", async ({ page }) => {
    await page.goto("/admin");
    await page.waitForURL(/\/auth/, { timeout: 20_000 });
  });
});
