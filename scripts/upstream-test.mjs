import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import { existsSync } from "node:fs";
import { build } from "vite";
if (process.argv.includes("--prepare")) {
  await build({
    configFile: false,
    logLevel: "error",
    build: {
      outDir: ".research/contract-runner",
      emptyOutDir: true,
      target: "node22",
      lib: {
        entry: "scripts/upstream-fixture.ts",
        formats: ["es"],
        fileName: () => "fixture.mjs",
      },
      rollupOptions: { external: [/^node:/] },
    },
  });
  console.log(
    "Prepared standalone Linux contract runner. No upstream code executed.",
  );
  process.exit(0);
}
if (process.platform !== "linux") {
  console.log(
    "SKIP: upstream integration requires Linux, Bash and Mike Farah yq v4. Use Linux/WSL or CI; no upstream code was executed.",
  );
  process.exit(0);
}
const upstream = resolve(process.env.BACKFORT_UPSTREAM || ".research/upstream");
if (!existsSync(upstream)) {
  console.error(
    "Missing audited checkout. See docs/testing.md. This suite never downloads it implicitly.",
  );
  process.exit(2);
}
const yq = spawnSync("yq", ["--version"], { encoding: "utf8" });
if (yq.status !== 0 || !/mikefarah.*version v4\./i.test(yq.stdout)) {
  console.log("SKIP: Mike Farah yq v4 is unavailable.");
  process.exit(process.env.CI ? 2 : 0);
}
await build({
  configFile: false,
  logLevel: "error",
  build: {
    outDir: ".research/contract-runner",
    emptyOutDir: true,
    target: "node22",
    lib: {
      entry: "scripts/upstream-fixture.ts",
      formats: ["es"],
      fileName: () => "fixture.mjs",
    },
    rollupOptions: { external: [/^node:/] },
  },
});
const r = spawnSync(
  process.execPath,
  [".research/contract-runner/fixture.mjs", upstream],
  { stdio: "inherit", timeout: 600000 },
);
process.exit(r.status ?? 2);
