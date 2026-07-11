import { test, expect } from "@playwright/test";

test.describe("DNS Lens", () => {
  test("loads homepage with search form", async ({ page }) => {
    await page.goto("/");

    await expect(
      page.getByRole("heading", {
        name: /bulk dns propagation checks/i
      })
    ).toBeVisible();

    await expect(page.getByRole("button", { name: /bulk search/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /single search/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /run bulk check/i })).toBeVisible();
  });

  test("single domain check streams resolver results", async ({ page }) => {
    await page.goto("/");

    await page.getByRole("button", { name: /single search/i }).click();

    const domainInput = page.getByPlaceholder("example.com");
    await domainInput.fill("example.com");

    const submit = page.getByRole("button", { name: /check dns/i });
    await expect(submit).toBeEnabled({ timeout: 20_000 });

    await submit.click();

    await expect(page.getByRole("heading", { name: /per-domain status/i })).toBeVisible({
      timeout: 15_000
    });

    await expect(page.locator("button").filter({ has: page.getByText("example.com", { exact: true }) })).toBeVisible();

    await expect(page.getByRole("heading", { name: /resolver stream/i })).toBeVisible();

    const resultsTable = page.getByRole("table");
    await expect(resultsTable.getByText("Cloudflare DNS")).toBeVisible({ timeout: 30_000 });

    const statusBadges = resultsTable.locator("tbody").getByText(/^(success|failed|timeout)$/i);
    await expect(statusBadges.first()).toBeVisible({ timeout: 45_000 });
  });

  test("bulk mode shows multiple domain cards", async ({ page }) => {
    await page.goto("/");

    const bulkTextarea = page.getByPlaceholder(/example\.com\nopenai\.com/i);
    await bulkTextarea.click();
    await bulkTextarea.fill("");
    await bulkTextarea.pressSequentially("example.com");
    await bulkTextarea.press("Enter");
    await bulkTextarea.pressSequentially("iana.org");

    await expect(page.getByText("2 valid / 20 max")).toBeVisible({ timeout: 10_000 });

    const submit = page.getByRole("button", { name: /run bulk check/i });
    await expect(submit).toBeEnabled({ timeout: 20_000 });

    await submit.click();

    const bulkSection = page
      .locator("section")
      .filter({ has: page.getByRole("heading", { name: /per-domain status/i }) });

    await expect(
      bulkSection.locator("button").filter({ has: page.getByText("example.com", { exact: true }) })
    ).toBeVisible({ timeout: 15_000 });
    await expect(
      bulkSection.locator("button").filter({ has: page.getByText("iana.org", { exact: true }) })
    ).toBeVisible();
  });

  test("shows validation error for invalid domain input", async ({ page }) => {
    await page.goto("/");

    await page.getByRole("button", { name: /single search/i }).click();
    await page.getByPlaceholder("example.com").fill("not a valid domain!!!");

    const submit = page.getByRole("button", { name: /check dns/i });
    await expect(submit).toBeEnabled({ timeout: 20_000 });
    await submit.click();

    await expect(page.getByText(/valid domain/i)).toBeVisible();
  });
});
