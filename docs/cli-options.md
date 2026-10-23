# CLI contract and UI coverage

Backfort **1.3.0**, **287f1a4ca80237e99b902ebcf42e57a4346b5ab4**. Canonical source: [backfort.sh parser](https://github.com/shellharbor/backfort/blob/287f1a4ca80237e99b902ebcf42e57a4346b5ab4/backfort.sh#L7158). `src/data/upstream.ts` is the bundled registry. No runtime API fetch is performed.

## Global options

| Option | Meaning | Builder |
| --- | --- | --- |
| `-c FILE` | Server YAML path; before subcommand; rejected by quick modes | UI |
| `-n`, `--dry-run` | Plan for supported operations, not a universal read-only modifier | UI for run/quick/quick-compose/prune |
| `-h`, `--help` | Help | Documentation |
| `-V`, `--version` | Engine version | Installation |

The builder emits no `--config`, `install`, `init`, `--s3`, `--schedule`, `--force`, `--encrypt` or global `--json`. `--print-example-config` belongs only to the Python launcher.

## Commands

| Command | Arguments/options | Scope/coverage |
| --- | --- | --- |
| `run` | `--job NAME`; global dry-run | UI; chosen job or all |
| `doctor` | `--job NAME` | UI; server config/environment validation |
| `list` | `--job NAME`, `--json` | UI text output; JSON docs-only |
| `status` | `--job NAME` | UI |
| `watchdog` | `--job NAME`, `--max-age HOURS` (1..8760) | Advanced YAML threshold; command docs-only |
| `diff` | `ID1 ID2`, `--from DEST`, `--json` | Docs-only; manifest index comparison |
| `pin` | `ID`, `--from DEST`, `--reason TEXT` | Docs-only; reason one line ≤200 chars; runtime markers |
| `unpin` | `ID`, `--from DEST` | Docs-only; deliberate removal of protection |
| `verify` | `ID` or `latest --job NAME`, `--from DEST`, `--quick` / `--full` | UI full/latest; other selectors docs-only |
| `restore` | `ID` or `latest --job NAME`, `--to DIR`, `--from DEST` | UI latest into staging; other selectors docs-only |
| `restore --pick` | `--to DIR`, optional `--job NAME`, `--from DEST` | Docs-only; interactive terminal required |
| `restore-compose` | `ID` or `latest --job NAME`, `--to DIR`, `--from DEST` | UI staging only |
| `restore-compose` import | Separate `--project-dir DIR --apply --confirm` | Docs-only; changes target DB; no dry-run; no MSSQL/Oracle apply |
| `prune` | `--job NAME`; global dry-run | UI preview only; schedule files optional and initially disabled |
| `delete` | `--job NAME --since YYYY-MM-DD --until YYYY-MM-DD`, optional `--from DEST`, `--confirm`, dry-run | Docs-only preview; inclusive UTC dates; min_keep does not apply; pins protected |
| `quick` | `PATH [PATH...]`; `--name`, repeated `--to`/`--exclude`, `--min-copies`, `--follow-symlinks`, `--state-directory`, dry-run | UI; fixed gzip 6 / encryption none |
| `quick-compose` | `PROJECT_DIR`; `--name`, repeated `--file`/`--to`/`--volume`/`--bind`/`--db`, `--min-copies`, `--volume-helper-image`, `--state-directory`, dry-run | UI; helper only with volumes; fixed gzip 6 / encryption none |

`--bind` takes `NAME:RELATIVE_PATH`. `--db` takes `NAME:SERVICE:ENGINE:USER:PASSWORD_ENV:DB1,DB2`; engines are postgres/mysql/mariadb only. PostgreSQL quick uses SQL. Durable PostgreSQL defaults to custom. Saved quick recovery paths use STATE/quick/NAME.yaml or STATE/quick-compose/NAME.yaml and are written by a real run only. Reusing a name can replace that config. Without explicit state, paths depend on XDG_STATE_HOME/HOME of the execution account, not the browser.

Watchdog/diff/pin/unpin reject dry-run. Doctor/list/status/verify must not be described as generic plan operations. The builder deliberately limits executable workflows instead of mechanically appending global flags. Optional `--from` and full-ID cross-host recovery are documented operations rather than form builders.

## Configuration capability coverage

| Capability | Coverage |
| --- | --- |
| Host ID; explicit files/paths/excludes; multiple jobs/destinations; per-job references/min_copies | Basic |
| Compose project/manifests/binds; PG/MySQL/MariaDB dump definitions | Basic |
| gzip 1..9, zstd 1..19, none (no level) | Basic |
| none / age single or multiple recipients / GPG symmetric and asymmetric | Basic |
| GFS last/daily/weekly/monthly; min_keep | Basic |
| Symlinks; Compose volumes/helper/timeout; MSSQL backup_directory; Oracle connect/directory/path | Advanced |
| Minisign env names; literal pre/post hooks; optional positive max_age_days | Advanced |
| State/temp/lock/min_free_mb; watchdog jobs/threshold; metrics directory | Advanced |
| Telegram, ntfy, webhook, SMTP TLS, default events/antiflood/digest | Advanced |
| Notification templates, per-channel event overrides, diff/pins/delete/picker/full IDs/from/DB apply | Docs-only |
| systemd run timer; separate prune timer; `/etc/cron.d` with account/PATH/timezone/logging | Optional review files; disabled by default |
| Interactive Python/container/Helm runners, automatic DB imports or destructive builders | Outside interactive scope |

Custom template whitelist and emission differences are in [the audit](upstream-compatibility.md). A Python launcher is not a Python engine rewrite or a native Windows engine. Container/Helm configuration has an explicit separate filesystem/mount/value contract.

## Exit codes and safety

0 = success; 1 = partial destinations with threshold met; 2 = CLI/config/dependency/environment error; 3 = operational failure or threshold failure. Some saved-job preflight issues return 3 where doctor returns 2.

Prune is independent from run. Unfinished bundles without `.complete` are not ready copies. Full verify and recovery require decryption material. Restore targets must be new/empty, with an existing accessible parent, separate from source and working storage. No force, production apply or automatic staging cleanup is generated.
