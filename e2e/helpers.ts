import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { expect, type Locator, type Page } from "@playwright/test";

/** Load e2e/.env.local into process.env (simple KEY=VALUE, no exports). */
export function loadE2EEnv() {
  const path = resolve(process.cwd(), "e2e/.env.local");
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq < 0) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (!(key in process.env)) process.env[key] = value;
  }
}

loadE2EEnv();

export function uniqueSuffix() {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

/** Unique Kenyan-looking national ID (8 digits) for this run. */
export function uniqueNationalId() {
  return String(30_000_000 + (Date.now() % 9_000_000));
}

/** Unique Kenyan mobile in +2547XXXXXXXX form. */
export function uniquePhone() {
  const n = String(Date.now() % 100_000_000).padStart(8, "0");
  return `+2547${n}`;
}

export function adminCredentials() {
  const email = process.env.E2E_ADMIN_EMAIL;
  const password = process.env.E2E_ADMIN_PASSWORD;
  if (!email || !password) {
    return null;
  }
  return { email, password };
}

export async function gotoAuth(page: Page, redirect?: string) {
  const path = redirect ? `/auth?redirect=${encodeURIComponent(redirect)}` : "/auth";
  await page.goto(path);
  await expect(page.getByRole("tab", { name: "Log in" })).toBeVisible();
}

export async function login(page: Page, email: string, password: string) {
  await gotoAuth(page);
  await page.getByRole("tab", { name: "Log in" }).click();
  await page.locator("#li-email").fill(email);
  await page.locator("#li-pass").fill(password);
  await page.getByRole("button", { name: "Log in", exact: true }).click();
}

export async function signOutIfPresent(page: Page) {
  const signOut = page.getByRole("button", { name: /sign out/i });
  if (await signOut.isVisible().catch(() => false)) {
    await signOut.click();
    await page.waitForTimeout(500);
  }
}

export type SignupIntent = "vote" | "vie" | "both";

export async function signup(page: Page, opts: {
  fullName: string;
  email: string;
  password: string;
  intent: SignupIntent;
  nationalId?: string;
  phone?: string;
  county?: string;
  constituency?: string;
  ward?: string;
}) {
  await gotoAuth(page);
  await page.getByRole("tab", { name: "Sign up" }).click();
  await page.locator("#su-name").fill(opts.fullName);
  await page.locator("#su-email").fill(opts.email);
  await page.locator("#su-pass").fill(opts.password);
  await page.locator("#su-confirm").fill(opts.password);

  const intentLabel = opts.intent === "vote" ? "Vote" : opts.intent === "vie" ? "Vie" : "Both";
  await page.getByRole("button", { name: intentLabel, exact: true }).click();

  if (opts.nationalId) {
    await page.getByPlaceholder(/e\.g\. 34567890|e\.g\. 31245678/).fill(opts.nationalId);
  }
  if (opts.phone) {
    await page.getByPlaceholder(/\+254 7XX/).fill(opts.phone);
  }

  if (opts.intent === "vote" || opts.intent === "both") {
    await selectFirstOption(page, "County");
    await page.waitForTimeout(300);
    await selectFirstOption(page, "Constituency");
    await page.waitForTimeout(300);
    await selectFirstOption(page, "Ward");
  }

  const submitName =
    opts.intent === "vie" ? "Create account & apply to vie" : "Create account";
  await page.getByRole("button", { name: submitName }).click();
}

/** Open a Radix Select by its visible label text and pick an option. */
export async function selectByLabel(page: Page, label: string, option: string) {
  const labelEl = page.getByText(new RegExp(`^${escapeRegExp(label)}\\b`)).first();
  await expect(labelEl).toBeVisible();
  const trigger = labelEl.locator("xpath=following::*[@role='combobox'][1]");
  await trigger.click();
  const listbox = page.getByRole("listbox");
  await expect(listbox).toBeVisible({ timeout: 5_000 });
  const opt = listbox.getByRole("option", { name: option, exact: true });
  await opt.waitFor({ state: "attached", timeout: 10_000 });
  await opt.evaluate((el: HTMLElement) => el.click());
}

/** Pick the first enabled option in a select identified by label. Returns the option text. */
export async function selectFirstOption(page: Page, label: string): Promise<string> {
  const labelEl = page.getByText(new RegExp(`^${escapeRegExp(label)}\\b`)).first();
  await expect(labelEl).toBeVisible();
  const trigger = labelEl.locator("xpath=following::*[@role='combobox'][1]");
  await trigger.click();
  const listbox = page.getByRole("listbox");
  await expect(listbox).toBeVisible({ timeout: 5_000 });
  const opt = listbox.getByRole("option").first();
  await expect(opt).toBeAttached();
  const text = ((await opt.textContent()) ?? "").trim();
  await opt.evaluate((el: HTMLElement) => el.click());
  return text;
}

function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function expectToast(page: Page, text: string | RegExp) {
  const toast = page.locator("[data-sonner-toast]").filter({ hasText: text }).first();
  await expect(toast).toBeVisible({ timeout: 20_000 });
}

export async function dismissDialogs(page: Page) {
  page.on("dialog", async (dialog) => {
    await dialog.accept(dialog.type() === "prompt" ? "e2e smoke reject" : undefined);
  });
}

/** Soft-skip when admin credentials are not configured. */
export function requireAdmin() {
  const creds = adminCredentials();
  if (!creds) {
    return null;
  }
  return creds;
}

export async function waitForUrl(page: Page, pattern: RegExp | string, timeout = 30_000) {
  await page.waitForURL(pattern, { timeout });
}

export function rowByText(page: Page, text: string | RegExp): Locator {
  return page.locator("tr").filter({ hasText: text }).first();
}
