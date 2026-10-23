import { test, expect, type Page, type TestInfo } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { parse } from "yaml";

async function continueTo(
  page: Page,
  info: TestInfo,
  title: string,
  name: string,
) {
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  const heading = page.getByRole("heading", { name: title, exact: true });
  await expect(heading).toBeVisible();
  await expect(heading).toBeInViewport();
  await expect(heading).toBeFocused();
  await page.screenshot({ path: info.outputPath(`${name}.png`) });
}

test("manual five-step plan downloads YAML and copies diagnostics and real-run commands", async ({
  page,
  context,
}, info) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("./#configure");
  await page
    .getByLabel("Stable host ID", { exact: true })
    .fill(`qa-${info.project.name}`);
  await continueTo(page, info, "What deserves a backup?", "01-sources");
  await page.locator(".error-summary button").first().click();
  await expect(
    page.getByRole("heading", { name: "What deserves a backup?", exact: true }),
  ).toBeInViewport();

  await page.getByLabel("Job name", { exact: true }).fill("qa-files");
  await page
    .getByLabel("Source paths", { exact: true })
    .fill("/srv/qa/uploads\n/srv/qa/O'Brien assets");
  await page
    .getByLabel("Exclude patterns", { exact: true })
    .fill("*.log\n*/cache/*");
  await continueTo(
    page,
    info,
    "Give your data another home.",
    "02-destinations",
  );

  await page
    .getByLabel("Absolute destination path", { exact: true })
    .fill("/var/backups/qa");
  await continueTo(page, info, "Make it yours. Keep it safe.", "03-protection");
  await page.getByRole("button", { name: "← Back", exact: true }).click();
  await expect(
    page.getByRole("heading", {
      name: "Give your data another home.",
      exact: true,
    }),
  ).toBeInViewport();
  await expect(
    page.getByLabel("Absolute destination path", { exact: true }),
  ).toHaveValue("/var/backups/qa");
  await continueTo(page, info, "Make it yours. Keep it safe.", "03-protection");
  await page.getByLabel("Encryption", { exact: true }).selectOption("age");
  await page
    .getByLabel("Recipient variable NAME", { exact: true })
    .fill("BACKFORT_AGE_RECIPIENT");
  await continueTo(page, info, "Your plan, ready for the server.", "04-review");

  await page
    .getByLabel("Server configuration path", { exact: true })
    .fill("/etc/backfort/O'Brien config.yaml");
  const downloadEvent = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Download YAML", exact: true })
    .click();
  const download = await downloadEvent;
  expect(download.suggestedFilename()).toBe("backfort.yaml");
  const yaml = await readFile((await download.path())!, "utf8");
  const config = parse(yaml);
  expect(config.version).toBe(1);
  expect(config.settings.host_id).toBe(`qa-${info.project.name}`);
  expect(config.jobs[0].name).toBe("qa-files");
  expect(config.jobs[0].source.paths).toEqual([
    "/srv/qa/uploads",
    "/srv/qa/O'Brien assets",
  ]);
  expect(config.jobs[0].source.exclude).toEqual(["*.log", "*/cache/*"]);
  expect(config.destinations[0].path).toBe("/var/backups/qa");
  expect(config.jobs[0].encryption).toEqual({
    method: "age",
    recipient_env: "BACKFORT_AGE_RECIPIENT",
  });
  expect(config).not.toHaveProperty("configPath");

  const diagnostics = page.locator(".code-block").filter({
    has: page.getByRole("region", {
      name: "Diagnostics · no real backup",
      exact: true,
    }),
  });
  await diagnostics.getByRole("button", { name: "Copy", exact: true }).click();
  const copiedChecks = (
    await page.evaluate(() => navigator.clipboard.readText())
  ).replaceAll("\r\n", "\n");
  expect(copiedChecks).toContain("'doctor' '--job' 'qa-files'");
  expect(copiedChecks).toContain("'--dry-run' 'run' '--job' 'qa-files'");
  expect(copiedChecks).toContain(
    `'-c' '/etc/backfort/O'"'"'Brien config.yaml'`,
  );
  expect(copiedChecks).not.toContain("--apply");
  await expect(diagnostics.getByRole("status")).toHaveText("Copied.");

  await page
    .getByText("3. Real backup — after reviewing sources and diagnostics", {
      exact: true,
    })
    .click();
  const realRun = page.locator(".code-block").filter({
    has: page.getByRole("region", {
      name: "Run on your Linux server",
      exact: true,
    }),
  });
  await realRun.getByRole("button", { name: "Copy", exact: true }).click();
  const copiedRun = await page.evaluate(() => navigator.clipboard.readText());
  expect(copiedRun).toContain("'run' '--job' 'qa-files'");
  expect(copiedRun).not.toContain("--dry-run");
  expect(copiedRun).not.toContain("prune");
  expect(copiedRun).not.toContain("--apply");
  expect(copiedRun).not.toContain("$");
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(page.viewportSize()!.width);
  expect(errors).toEqual([]);
  await page.screenshot({ path: info.outputPath("05-copied-command.png") });
});
