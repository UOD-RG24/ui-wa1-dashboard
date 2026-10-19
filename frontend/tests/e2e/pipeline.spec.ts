import { expect, test } from "@playwright/test";

test("local JWT sign-in runs the fixed pipeline and renders live twins", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email address").fill("ada@example.org");
  await page.getByLabel("Password").fill("correct-horse-battery-staple");
  await page.getByRole("button", { name: "Sign in with local JWT" }).click();
  await expect(page).toHaveURL("/");
  await expect(page.getByText("Mock end-to-end cohort").first()).toBeVisible();

  const slots = page.getByLabel("Owned dataset");
  await slots.nth(0).selectOption("64b000000000000000000011");
  await slots.nth(1).selectOption("64b000000000000000000012");
  await slots.nth(2).selectOption("64b000000000000000000013");
  await page.getByLabel(/I confirm these files contain de-identified research data/).check();
  await page.getByRole("button", { name: "Start fixed pipeline" }).click();

  await expect(page.getByRole("option", { name: /succeeded/ })).toHaveCount(1, { timeout: 12_000 });
  await expect(page.getByText("TCGA-AA-0001")).toBeVisible();
  await expect(page.getByText("2 / 2 twins live")).toBeVisible();

  await page.getByRole("button", { name: "Sign-Out" }).click();
  await expect(page).toHaveURL(/\/login/);
});

test("demo mode is visibly isolated from live records", async ({ page }) => {
  await page.goto("/?mode=demo");
  await expect(page.getByText("Demo data")).toBeVisible();
  await expect(page.getByText("CPTAC BRCA twin integration").first()).toBeVisible();
  await expect(page.getByText("Mock end-to-end cohort")).toHaveCount(0);
});
