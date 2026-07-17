import { test, expect } from "@playwright/test";
import {
  login,
  requireAdmin,
  signup,
  uniqueNationalId,
  uniquePhone,
  uniqueSuffix,
  waitForUrl,
} from "../helpers";

/**
 * Auth smoke: voter signup, candidate (vie) signup, admin login.
 */
test.describe("Auth & registration", () => {
  test("voter signup creates account and reaches elections", async ({ page }) => {
    const suffix = uniqueSuffix();
    const email = `e2e.voter.${suffix}@example.com`;
    const password = `TestPass!${suffix}`;
    const nationalId = uniqueNationalId();
    const phone = uniquePhone();

    await signup(page, {
      fullName: `E2E Voter ${suffix}`,
      email,
      password,
      intent: "vote",
      nationalId,
      phone,
      county: "Nairobi",
      
    });

    await waitForUrl(page, /\/(elections|dashboard|candidates)/);
    await expect(page).not.toHaveURL(/\/auth$/);
  });

  test("candidate (vie) signup lands on apply page", async ({ page }) => {
    const suffix = uniqueSuffix();
    const email = `e2e.vie.${suffix}@example.com`;
    const password = `TestPass!${suffix}`;

    await signup(page, {
      fullName: `E2E Candidate ${suffix}`,
      email,
      password,
      intent: "vie",
      nationalId: uniqueNationalId(),
      phone: uniquePhone(),
    });

    await waitForUrl(page, /\/candidates\/apply/);
    await expect(page.getByText(/apply to vie/i).first()).toBeVisible();
  });

  test("admin login redirects to admin dashboard", async ({ page }) => {
    const admin = requireAdmin();
    test.skip(!admin, "Set E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD in e2e/.env.local");

    await login(page, admin!.email, admin!.password);
    await waitForUrl(page, /\/admin/);
    await expect(page.getByText(/admin control center|MY-KDM Operations/i).first()).toBeVisible();
  });

  test("invalid login shows credentials error", async ({ page }) => {
    await login(page, "nobody@example.com", "wrong-password-xyz");
    await expect(
      page.getByText(/incorrect email or password|invalid login|credentials/i).first(),
    ).toBeVisible({ timeout: 15_000 });
  });
});
