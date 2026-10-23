import { spawn } from "node:child_process";
const port = "4180",
  url = `http://127.0.0.1:${port}/backfort-docs/`;
const server = spawn(process.execPath, ["scripts/static-server.mjs"], {
  env: { ...process.env, TEST_PORT: port },
  stdio: ["ignore", "pipe", "inherit"],
});
try {
  await new Promise((resolve, reject) => {
    server.stdout.once("data", resolve);
    server.once("error", reject);
    server.once("exit", (code) => reject(new Error(`Server exited ${code}`)));
  });
  for (const suffix of ["", "favicon.svg", ".nojekyll"])
    if ((await fetch(url + suffix)).status !== 200)
      throw new Error("Missing production-prefix asset: " + suffix);
  if (
    (await fetch(`http://127.0.0.1:${port}/assets/missing.js`)).status !== 404
  )
    throw new Error("Unexpected SPA fallback");
  const cli = "node_modules/@playwright/test/cli.js";
  const child = spawn(process.execPath, [cli, "test"], {
    env: { ...process.env, PLAYWRIGHT_BASE_URL: url },
    stdio: "inherit",
  });
  const code = await new Promise((resolve, reject) => {
    child.once("exit", resolve);
    child.once("error", reject);
  });
  process.exitCode = Number(code) || 0;
} finally {
  server.kill();
}
