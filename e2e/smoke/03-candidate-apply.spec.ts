import { test, expect, type Page } from "@playwright/test";
import {
  selectByLabel,
  signup,
  uniqueNationalId,
  uniquePhone,
  uniqueSuffix,
  waitForUrl,
} from "../helpers";

async function pickOpenBallotPosition(page: Page): Promise<boolean> {
  for (const tier of ["National", "County", "Constituency", "Ward"] as const) {
    await page.getByText(/^Tier/).scrollIntoViewIfNeeded();
    await selectByLabel(page, "Tier", tier);
    await page.waitForTimeout(400);

    const trigger = page
      .getByText(/^Ballot position/)
      .locator("xpath=following::*[@role='combobox'][1]");
    await trigger.click();
    const options = page.getByRole("option");
    const count = await options.count();
    if (count > 0) {
      await options.first().evaluate((el: HTMLElement) => el.click());
      return true;
    }
    await page.keyboard.press("Escape");
  }
  return false;
}

/**
 * Candidate application smoke.
 * Requires at least one position with nominations open.
 */
test.describe("Candidate application", () => {
  test("apply form submits when nominations are open", async ({ page }) => {
    const suffix = uniqueSuffix();
    const nationalId = uniqueNationalId();
    const phone = uniquePhone();

    await signup(page, {
      fullName: `E2E Applicant ${suffix}`,
      email: `e2e.apply.${suffix}@example.com`,
      password: `TestPass!${suffix}`,
      intent: "vie",
      nationalId,
      phone,
    });
    await waitForUrl(page, /\/candidates\/apply/);

    const closedBanner = page.getByText(/nominations are not open/i);
    if (await closedBanner.isVisible().catch(() => false)) {
      test.skip(true, "No positions have applications_open — open nominations in admin first");
    }

    const idInput = page.getByPlaceholder(/e\.g\. 31245678/);
    if (await idInput.isVisible().catch(() => false)) {
      await idInput.fill(nationalId);
    }
    const phoneInput = page.getByPlaceholder(/\+254 7XX/);
    if (await phoneInput.isVisible().catch(() => false)) {
      await phoneInput.fill(phone);
    }

    const picked = await pickOpenBallotPosition(page);
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
});
