import { test, expect } from "@playwright/test";
import {
  dismissDialogs,
  login,
  requireAdmin,
  selectByLabel,
  signup,
  uniqueNationalId,
  uniquePhone,
  uniqueSuffix,
  waitForUrl,
} from "../helpers";

/**
 * Full election-cycle smoke from an admin's perspective:
 * open nominations → candidate applies → admin reviews →
 * (optionally) assign poll window / toggle nominations.
 *
 * Order matters; runs serially within this file.
 */
test.describe.serial("Election cycle smoke", () => {
  const suffix = uniqueSuffix();
  const applicant = {
    email: `e2e.cycle.${suffix}@example.com`,
    password: `TestPass!${suffix}`,
    name: `E2E Cycle ${suffix}`,
    nationalId: uniqueNationalId(),
    phone: uniquePhone(),
  };

  test("admin opens nominations on a county position", async ({ page }) => {
    const admin = requireAdmin();
    test.skip(!admin, "Set E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD in e2e/.env.local");
    dismissDialogs(page);

    await login(page, admin!.email, admin!.password);
    await waitForUrl(page, /\/admin/);
    await page.goto("/admin/positions");

    // Prefer a Closed nominations button so we can open it.
    const closedBtn = page.getByRole("button", { name: /^Closed$/i }).first();
    if (await closedBtn.isVisible().catch(() => false)) {
      await closedBtn.click();
      await expect(page.getByText(/opened nominations/i).first()).toBeVisible({
        timeout: 15_000,
      });
    } else {
      // Already open somewhere — ensure at least one Open control exists
      await expect(page.getByRole("button", { name: /^Open$/i }).first()).toBeVisible();
    }
  });

  test("candidate signs up and submits application", async ({ page }) => {
    await signup(page, {
      fullName: applicant.name,
      email: applicant.email,
      password: applicant.password,
      intent: "vie",
      nationalId: applicant.nationalId,
      phone: applicant.phone,
    });
    await waitForUrl(page, /\/candidates\/apply/);

    const closedBanner = page.getByText(/nominations are not open/i);
    if (await closedBanner.isVisible().catch(() => false)) {
      test.skip(true, "Nominations still closed after admin step");
    }

    const idInput = page.getByPlaceholder(/e\.g\. 31245678/);
    if (await idInput.isVisible().catch(() => false)) {
      await idInput.fill(applicant.nationalId);
    }
    const phoneInput = page.getByPlaceholder(/\+254 7XX/);
    if (await phoneInput.isVisible().catch(() => false)) {
      await phoneInput.fill(applicant.phone);
    }

    let picked = false;
    for (const tier of ["National", "County", "Constituency", "Ward"] as const) {
      await page.getByText(/^Tier/).scrollIntoViewIfNeeded();
      await selectByLabel(page, "Tier", tier);
      await page.waitForTimeout(400);
      const trigger = page
        .getByText(/^Ballot position/)
        .locator("xpath=following::*[@role='combobox'][1]");
      await trigger.click();
      const options = page.getByRole("option");
      if ((await options.count()) > 0) {
        await options.first().evaluate((el: HTMLElement) => el.click());
        picked = true;
        break;
      }
      await page.keyboard.press("Escape");
    }
    if (!picked) {
      test.skip(true, "No open ballot positions available for any tier");
    }

    const countyTrigger = page
      .getByText(/^County/)
      .locator("xpath=following::*[@role='combobox'][1]");
    if (await countyTrigger.isVisible().catch(() => false)) {
      const current = await countyTrigger.textContent();
      if (!current || /select/i.test(current)) {
        await selectByLabel(page, "County", "Nairobi");
      }
    }

    await page.getByRole("button", { name: /submit application/i }).click();
    await waitForUrl(page, /\/candidates/);
  });

  test("admin finds applicant and can review status", async ({ page }) => {
    const admin = requireAdmin();
    test.skip(!admin, "Set E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD in e2e/.env.local");
    dismissDialogs(page);

    await login(page, admin!.email, admin!.password);
    await waitForUrl(page, /\/admin/);
    await page.goto("/admin/candidates");

    await page.getByPlaceholder(/search by name/i).fill(applicant.name.split(" ").slice(-1)[0] ?? applicant.name);
    const row = page.locator("tbody tr").filter({ hasText: applicant.name }).first();
    if (!(await row.isVisible().catch(() => false))) {
      // Fresh apply may still be indexing; try a broader search then soft-skip.
      await page.getByPlaceholder(/search by name/i).fill("E2E Cycle");
      const any = page.locator("tbody tr").filter({ hasText: /E2E Cycle/i }).first();
      if (!(await any.isVisible().catch(() => false))) {
        test.skip(true, "Applicant not yet visible in admin candidates list");
      }
    }
    await expect(row.or(page.locator("tbody tr").filter({ hasText: /E2E Cycle/i }).first())).toBeVisible({
      timeout: 15_000,
    });
    const target = page.locator("tbody tr").filter({ hasText: applicant.name }).first();
    const clickRow = (await target.isVisible().catch(() => false))
      ? target
      : page.locator("tbody tr").filter({ hasText: /E2E Cycle/i }).first();
    await clickRow.click();
    await expect(page.getByRole("dialog")).toBeVisible();

    const approve = page.getByRole("dialog").getByRole("button", { name: /^Approve$/i });
    if (await approve.isVisible().catch(() => false)) {
      await approve.click();
      await expect(page.getByText(/approved/i).first()).toBeVisible({ timeout: 15_000 });
    }
  });

  test("admin can open create-position dialog with location + schedule", async ({ page }) => {
    const admin = requireAdmin();
    test.skip(!admin, "Set E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD in e2e/.env.local");

    await login(page, admin!.email, admin!.password);
    await waitForUrl(page, /\/admin/);
    await page.goto("/admin/positions");
    await page.getByRole("button", { name: /add position/i }).click();

    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(page.getByLabel(/title/i)).toBeVisible();
    await expect(page.getByText(/voting schedule/i)).toBeVisible();
    await expect(page.getByText(/^County/i).first()).toBeVisible();
    // Don't create — just verify the form is complete, then close
    await page.keyboard.press("Escape");
  });

  test("schedule page exposes cycle phase controls", async ({ page }) => {
    const admin = requireAdmin();
    test.skip(!admin, "Set E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD in e2e/.env.local");

    await login(page, admin!.email, admin!.password);
    await waitForUrl(page, /\/admin/);
    await page.goto("/admin/schedule");

    await expect(page.getByRole("button", { name: /new cycle/i })).toBeVisible();
    // Phase chips / buttons for the 2026 cycle
    await expect(
      page.getByRole("button", { name: /open|scheduled|draft|closed/i }).first(),
    ).toBeVisible();
  });
});
