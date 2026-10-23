import { spawnSync } from "node:child_process";
const pinned = "287f1a4ca80237e99b902ebcf42e57a4346b5ab4";
const ref = process.argv[2] || "refs/heads/main";
if (!/^[A-Za-z0-9._/-]+$/.test(ref))
  throw new Error("Use a Git ref, not a command.");
const result = spawnSync(
  "git",
  ["ls-remote", "https://github.com/shellharbor/backfort.git", ref],
  { encoding: "utf8", timeout: 30000 },
);
if (result.status !== 0) {
  console.error(result.stderr || "Unable to read upstream");
  process.exit(2);
}
const current = result.stdout.trim().split(/\s/)[0];
if (!current) {
  console.error("No matching ref");
  process.exit(2);
}
console.log(`Pinned: ${pinned}\nSelected ref: ${ref}\nResolved: ${current}`);
if (current !== pinned) {
  console.error(
    "UPSTREAM DRIFT: review parser/schema, update audit and rerun contract tests. Supported version has not changed.",
  );
  process.exit(1);
}
console.log("Pinned contract matches selected ref.");
