import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { readFile } from "node:fs/promises";
import { parse } from "yaml";
test("durable files journey, download, copy fallback, locale, reset and accessibility", async ({
  page,
}, info) => {
  const failures: string[] = [];
  page.on("pageerror", (e) => failures.push(e.message));
  const requests: string[] = [];
  page.on("request", (r) => requests.push(r.url()));
  await page.goto("./");
  await expect(page).toHaveTitle(/Backfort/);
  await page
    .getByRole("link", { name: "Build your backup plan", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Download YAML", exact: true }),
  ).toHaveCount(0);
  await page
    .getByRole("button", { name: "Files → local", exact: false })
    .click();
  await page.getByRole("button", { name: "02 Sources", exact: true }).click();
  const sourcePaths = page.getByLabel("Source paths", { exact: true });
  await sourcePaths.fill("/srv/app/O'Brien uploads");
  await sourcePaths.press("End");
  await sourcePaths.press("Enter");
  await sourcePaths.pressSequentially("/srv/документы");
  await expect(sourcePaths).toHaveValue(
    "/srv/app/O'Brien uploads\n/srv/документы",
  );
  await page.getByRole("button", { name: "Advanced", exact: true }).click();
  await page.getByLabel("Follow symbolic links", { exact: true }).check();
  await page.getByRole("button", { name: "Basic", exact: true }).click();
  await page.getByRole("button", { name: "Switch to Russian" }).click();
  await expect(page.getByLabel("Пути источников", { exact: true })).toHaveValue(
    "/srv/app/O'Brien uploads\n/srv/документы",
  );
  await page.getByRole("button", { name: "Переключить на английский" }).click();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(
    page.getByText("Ready for checks on your server.", { exact: true }),
  ).toBeVisible();
  const waitDownload = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Download YAML", exact: true })
    .click();
  const file = await waitDownload;
  expect(file.suggestedFilename()).toBe("backfort.yaml");
  const contents = await readFile((await file.path())!, "utf8");
  const saved = parse(contents);
  expect(saved.jobs[0].source.paths).toEqual([
    "/srv/app/O'Brien uploads",
    "/srv/документы",
  ]);
  expect(saved.jobs[0].source.follow_symlinks).toBe(true);
  await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);
  await page
    .locator(".preview")
    .getByRole("button", { name: "Copy", exact: true })
    .click();
  expect(
    (await page.evaluate(() => navigator.clipboard.readText())).replaceAll(
      "\r\n",
      "\n",
    ),
  ).toBe(contents);
  await page.getByRole("button", { name: "Switch to Russian" }).click();
  await expect(page.locator(".preview").getByRole("status")).toHaveText(
    "Скопировано.",
  );
  await page.getByRole("button", { name: "Переключить на английский" }).click();
  await page.evaluate(() =>
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText: () => Promise.reject(new Error("denied")) },
      configurable: true,
    }),
  );
  await page
    .locator(".preview")
    .getByRole("button", { name: "Copy", exact: true })
    .click();
  await expect(
    page.locator(".preview").getByLabel("Copy text manually"),
  ).toBeVisible();
  await page.getByRole("button", { name: "Switch to Russian" }).click();
  await expect(page.locator(".preview").getByRole("status")).toHaveText(
    "Буфер обмена недоступен. Выделите текст ниже и скопируйте.",
  );
  await page.getByRole("button", { name: "Переключить на английский" }).click();
  const axe = await new AxeBuilder({ page }).analyze();
  expect(
    axe.violations.map((v) => ({
      id: v.id,
      nodes: v.nodes.map((n) => ({
        target: n.target,
        summary: n.failureSummary,
      })),
    })),
  ).toEqual([]);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  expect(
    await page.evaluate(() => ({
      local: localStorage.length,
      session: sessionStorage.length,
    })),
  ).toEqual({ local: 0, session: 0 });
  expect(
    requests.filter((u) => new URL(u).origin !== new URL(page.url()).origin),
  ).toEqual([]);
  expect(failures).toEqual([]);
  await page.screenshot({
    path: `test-results/evidence-${info.project.name}-wizard.png`,
    fullPage: true,
  });
  await page
    .getByRole("button", { name: "Reset configuration", exact: true })
    .click();
  await expect(
    page.getByRole("heading", {
      name: "A little planning. A lot of peace of mind.",
    }),
  ).toBeVisible();
  await expect(page.locator(".preview .code-block")).toHaveCount(0);
  await expect(
    page.getByRole("heading", {
      name: "A little planning. A lot of peace of mind.",
    }),
  ).toBeInViewport();
  await expect(
    page.getByRole("heading", {
      name: "A little planning. A lot of peace of mind.",
    }),
  ).toBeFocused();
});
test("offsite encryption, multiple jobs/destinations, invalid output and quick-compose", async ({
  page,
}) => {
  await page.goto("./#configure");
  await page
    .getByRole("button", { name: "Encrypted offsite", exact: false })
    .click();
  await expect(page.locator(".preview")).toContainText("2 required copies");
  await expect(page.locator(".preview")).toContainText("age");
  await page
    .getByRole("button", { name: "Destinations", exact: false })
    .click();
  await page
    .getByRole("button", { name: "Remove destination", exact: true })
    .last()
    .click();
  await expect(page.locator(".preview .code-block")).toHaveCount(0);
  await page.getByLabel("Minimum successful copies", { exact: true }).fill("1");
  await expect(page.locator(".preview .code-block")).toHaveCount(1);
  await page.getByRole("button", { name: "02 Sources", exact: true }).click();
  await page.getByRole("button", { name: "+ Add job", exact: true }).click();
  await page.getByLabel("Source paths", { exact: true }).fill("/srv/second");
  await expect(page.locator(".preview")).toContainText("job-2");
  await page.getByRole("button", { name: "The plan", exact: false }).click();
  await page
    .getByRole("button", { name: "Compose + PostgreSQL", exact: false })
    .click();
  await page
    .getByRole("button", { name: "Quick Compose backup", exact: false })
    .click();
  await page.getByRole("button", { name: "02 Sources", exact: true }).click();
  await expect(
    page.getByText("Quick PostgreSQL dumps use plain SQL.", { exact: true }),
  ).toBeVisible();
  await page
    .locator(".preview")
    .getByRole("button", { name: "Commands", exact: true })
    .click();
  const preview = await page.locator(".preview pre").innerText();
  expect(preview).toContain("quick-compose");
  expect(preview).not.toContain("'-c'");
  expect(preview).not.toContain("--encrypt");
  expect(preview).not.toContain("--format");
});
test("production prefix, direct anchor, mobile and keyboard", async ({
  page,
}, info) => {
  const errors: string[] = [];
  page.on("response", (r) => {
    if (r.status() >= 400) errors.push(r.url());
  });
  await page.goto("./#recovery");
  await expect(page.locator("#recovery")).toBeInViewport();
  await page.reload();
  await expect(page.locator("#recovery")).toBeInViewport();
  await page.goto("./");
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("link", { name: "Skip to configurator" }),
  ).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.locator("#configure")).toBeInViewport();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  expect(await page.locator('link[rel="icon"]').getAttribute("href")).toBe(
    "/backfort-docs/favicon.svg",
  );
  expect(errors).toEqual([]);
  await page.goto("./");
  await page.screenshot({
    path: `test-results/evidence-${info.project.name}-overview.png`,
  });
});
