export const upstream = {
  version: "1.3.0",
  commit: "287f1a4ca80237e99b902ebcf42e57a4346b5ab4",
  date: "2026-10-23",
  repo: "https://github.com/shellharbor/backfort",
  referenceCommit: "1744157154e84a1829591deb918c8b1fd625ba48",
} as const;
export const sourceLink = (path: string) =>
  `${upstream.repo}/blob/${upstream.commit}/${path}`;
export const registry = [
  ["run", "--job NAME; -n before command", "UI"],
  ["doctor", "--job NAME", "UI"],
  ["list", "--job NAME, --json", "UI"],
  ["status", "--job NAME", "UI"],
  ["watchdog", "--job NAME, --max-age HOURS (1..8760)", "Advanced"],
  ["diff", "ID1 ID2, --from DEST, --json", "docs"],
  ["pin", "ID, --from DEST, --reason TEXT (single line, ≤200)", "docs"],
  ["unpin", "ID, --from DEST", "docs"],
  ["verify", "ID or latest --job NAME, --from DEST, --quick|--full", "UI"],
  [
    "restore",
    "ID or latest --job NAME, --to DIR, --from DEST; --pick requires a terminal",
    "UI",
  ],
  [
    "restore-compose",
    "ID/latest --job, --to, --from; --project-dir + --apply + --confirm separately",
    "UI / docs",
  ],
  ["prune", "--job NAME; -n before command", "UI (preview)"],
  [
    "delete",
    "--job NAME, --since DATE, --until DATE, --from DEST, --confirm; -n before command",
    "docs",
  ],
  [
    "quick",
    "PATH… --name, --to (repeat), --exclude (repeat), --min-copies, --follow-symlinks, --state-directory",
    "UI",
  ],
  [
    "quick-compose",
    "PROJECT_DIR --name, --file/--to/--volume/--bind/--db (repeat), --min-copies, --volume-helper-image, --state-directory",
    "UI",
  ],
] as const;
export const emittedEvents = [
  "failure",
  "partial",
  "success",
  "recovery",
  "watchdog",
  "restore_success",
  "restore_failure",
  "prune",
];
