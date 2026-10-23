import { test, expect } from "@playwright/test";
test("responsive layouts and language do not overflow", async ({
  page,
}, info) => {
  for (const width of [360, 390, 820, 1280]) {
    await page.setViewportSize({ width, height: 850 });
    await page.goto("./");
    const overflow = await page.evaluate(() => ({
      width: innerWidth,
      scroll: document.documentElement.scrollWidth,
      nodes: [...document.querySelectorAll("body *")]
        .filter((e) => {
          const r = e.getBoundingClientRect();
          return (
            r.right > innerWidth + 1 && getComputedStyle(e).position !== "fixed"
          );
        })
        .map((e) => ({
          tag: e.tagName,
          cls: e.className,
          right: e.getBoundingClientRect().right,
        }))
        .slice(0, 15),
    }));
    expect(overflow.scroll, JSON.stringify(overflow)).toBeLessThanOrEqual(
      width,
    );
    await page.screenshot({
      path: `test-results/overview-${info.project.name}-${width}.png`,
    });
    await page.getByRole("button", { name: "Switch to Russian" }).click();
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(width);
  }
});
