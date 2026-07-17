import { test, expect } from "@playwright/test";
import {
  dismissDialogs,
  login,
  requireAdmin,
  waitForUrl,
} from "../helpers";

/**
 * Admin console smoke — requires E2E_ADMIN_* credentials.
 */
test.describe("Admin console", () => {
  test.beforeEach(async ({ page }) => {
    const admin = requireAdmin();
    test.skip(!admin, "Set E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD in e2e/.env.local");
    dismissDialogs(page);
    await login(page, admin!.email, admin!.password);
    await waitForUrl(page, /\/admin/);
  });

  test("dashboard shows stats and quick links", async ({ page }) => {
    await expect(page.getByText(/admin control center/i).first()).toBeVisible();
    await expect(page.getByText("Candidate approvals")).toBeVisible();
    await expect(page.getByText("Ballot positions")).toBeVisible();
    await expect(page.getByText("Election schedule")).toBeVisible();
    await expect(page.getByRole("link", { name: /^Open/i }).first()).toBeVisible();
  });

  test("candidates page lists and filters", async ({ page }) => {
    await page.goto("/admin/candidates");
    await expect(page.getByText("Candidate management")).toBeVisible();
    await expect(page.getByPlaceholder(/search by name/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /^All \(/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /^Pending \(/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /^Approved \(/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /^Rejected \(/i })).toBeVisible();

    await page.getByPlaceholder(/search by name/i).fill("zzzz-no-match-e2e");
    await expect(page.getByText(/no candidates match|no candidates in this filter/i)).toBeVisible();
  });

  test("candidate row opens detail dialog", async ({ page }) => {
    await page.goto("/admin/candidates");
    await page.getByRole("button", { name: /^All \(/i }).click();
    const row = page.locator("tbody tr").first();
    if (!(await row.isVisible().catch(() => false))) {
      test.skip(true, "No candidates in database yet");
    }
    await row.click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText(/identity|candidacy|bio|review metadata/i).first()).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
  });

  test("positions page shows schedule filter and table", async ({ page }) => {
    await page.goto("/admin/positions");
    await expect(page.getByText("Ballot positions").first()).toBeVisible();
    await expect(page.getByText(/filter by schedule/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /add position/i })).toBeVisible();
    await expect(page.locator("table")).toBeVisible();
  });

  test("schedule page shows cycles", async ({ page }) => {
    await page.goto("/admin/schedule");
    await expect(page.getByText(/election cycle|poll window/i).first()).toBeVisible();
    await expect(page.getByText(/mykdm-2026|2026/i).first()).toBeVisible();
  });

  test("support pledges page loads", async ({ page }) => {
    await page.goto("/admin/support");
    await expect(page.getByText(/support pledge/i).first()).toBeVisible();
  });

  test("audit page loads", async ({ page }) => {
    await page.goto("/admin/audit");
    await expect(page.getByText(/audit/i).first()).toBeVisible();
  });

  test("users page loads for superadmin", async ({ page }) => {
    await page.goto("/admin/users");
    await expect(page.getByText(/this page didn't load/i)).toHaveCount(0);
    await expect(page.getByText("Admin users")).toBeVisible();
    await expect(page.getByRole("button", { name: /add admin/i })).toBeVisible();
  });

  test("can revert an approved candidate to pending when present", async ({ page }) => {
    await page.goto("/admin/candidates");
    await page.getByRole("button", { name: /^Approved \(/i }).click();
    const pendingBtn = page.locator("tbody tr").first().getByRole("button", { name: /^Pending$/i });
    if (!(await pendingBtn.isVisible().catch(() => false))) {
      test.skip(true, "No approved candidates to act on");
    }
    await pendingBtn.click();
    await expect(page.getByText(/reverted to pending|pending:/i).first()).toBeVisible({
      timeout: 15_000,
    });
  });
});
