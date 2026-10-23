# Testing and evidence

Verification date: **2026-10-23**. Windows host, Node **24.17.0**, npm **11.13.0**; Linux integration in **WSL Ubuntu** with standalone Node **22.20.0**, Bash, GNU utilities and Mike Farah yq **4.47.2**. The Linux binaries were downloaded from their official sources; Node's published SHA-256 list and yq's release SHA-256 were checked before execution.

## Local checks

```sh
npm ci
npm run check
npx playwright install chromium
npm run test:e2e
npm run test:pages
```

`check` runs ESLint, **69 domain tests**, strict TypeScript and Vite build. `test:e2e` serves the production build with Vite preview. `test:pages` uses a separate ordinary static server at `/backfort-docs/`, with no SPA fallback, checks favicon/.nojekyll and executes the same browser journeys. Build before either browser suite.

Domain coverage includes multiple paths/jobs/destinations, target duplication, dangling references/copy thresholds, compression ranges, age and both GPG modes, literal hook argv/signing, notification/monitoring dependencies, GFS/age limits, unsafe/control/traversal/overlapping paths, Unicode/spaces/apostrophes, YAML-looking values, quoted heredoc collisions, cron/systemd restrictions and invalid-output blocking. Literal shell probes are decoded through Bash, not merely string-snapshotted. Unit/browser tests never download or execute Backfort.

Browser coverage: durable files through download, native clipboard and forced clipboard failure fallback; EN/RU and Basic/Advanced preservation; keyboard-entered multiline paths; multiple jobs and destination removal; local+rclone+age; quick-compose SQL/no invented flags; direct anchors/reload, production asset prefix, no console/404 errors, no runtime external requests/storage, keyboard skip link, reset, and automated axe accessibility on the final configuration state. Layouts are checked at **360, 390, 820 and 1280 px** in both languages. Windows clipboard line endings are normalized for comparison; YAML values and contents must still match.

## Opt-in actual-engine suite

Linux with Node 22.12+, Bash 4.3+, Git, GNU tar/coreutils/findutils/gzip/flock/SHA tools and **Mike Farah yq v4**:

```sh
git clone https://github.com/shellharbor/backfort.git .research/upstream
git -C .research/upstream checkout --detach 287f1a4ca80237e99b902ebcf42e57a4346b5ab4
npm run test:upstream
```

An already existing checkout should be inspected and reused, not overwritten. `BACKFORT_UPSTREAM` may point to an explicitly prepared checkout. The suite checks its full SHA, obtains LF source via `git show`, bundles this site's generators and uses a verified unique `backfort-docs-*` temporary test root. No sudo, production directories, real Docker socket or cloud account is used. Cleanup resolves its own path and refuses anything outside the expected temporary-root prefix.

The suite prints a reasoned SKIP on non-Linux or missing yq; these are not passes. In CI, missing yq fails the contract gate. For cross-host WSL testing, `node scripts/upstream-test.mjs --prepare` builds a standalone `.research/contract-runner/fixture.mjs` without executing upstream; run that file with a Linux Node executable, a Linux-visible path to the checkout and yq in PATH. This preparation and execution route was used here because the primary project runtime is Windows. Test tooling stayed in ignored `.research/`; data fixtures stayed in Linux temporary storage. The engine creates and cleans its own short-lived quick-config/cache files under its documented temporary locations.

Actual successful checks in this session:

| Check | Result |
| --- | --- |
| Generated local YAML → doctor/dry-run | PASS |
| Real tiny local backup → full verify → staged restore | PASS; content and exclusions checked; original unchanged |
| Quick argv and dry-run non-persistence | PASS |
| Quick actual run, saved recovery config, full verify/restore | PASS |
| Upstream parser rejects invented/forbidden options | PASS |
| All five generated Compose database schemas | PASS via actual upstream validator |
| Age single/multiple recipients, GPG symmetric/asymmetric, signing/hooks | PASS via actual upstream validator; no private keys generated |
| Telegram/ntfy/webhook/SMTP, watchdog and metrics schemas | PASS via actual upstream validator; no messages sent |
| Compose PG + explicit bind/volume + local/rclone min_copies=2 | PASS with pinned upstream fake helpers; real bundle/verify/staging |
| Quick-compose argv + saved SQL format + verify/staging | PASS with pinned fake helpers |
| Real cloud delivery, live production Docker, vendor DB imports | NOT RUN |
| Real age/Minisign encryption/signatures; external notification delivery | NOT RUN; schema checks only |
| PyPI availability / container image digest | NOT VERIFIED; no runnable alternative runner advertised |
| Privileged server installation / enabled timers / destructive prune/delete | NOT RUN; generated instructions only |
| GitHub-hosted workflow and public deployment | Tracked separately in the [Pages workflow runs](https://github.com/shellharbor/backfort-docs/actions/workflows/pages.yml) |

## Browser evidence and limits

Both the preview browser suite and the final **ordinary-static-server prefix suite passed all 8 scenarios**. The final `npm run check` also passed all 69 domain tests, lint, strict TypeScript and build. Direct-entry anchors, minimum-width grid overflow, muted-text contrast and scrollable-code keyboard focus were corrected during verification. Screenshots are written to ignored `test-results/overview-*-{360,390,820,1280}.png`, `test-results/evidence-*-overview.png` and `test-results/evidence-*-wizard.png`; reports/traces are in ignored `playwright-report/` and `test-results/`. No benchmark, production backup, independent code review or exhaustive screen-reader audit is claimed.

Dependency audit reported **0 vulnerabilities** after updating yaml from 2.8.1 to **2.9.1** and adding the formatter. The initial yaml advisory was GHSA-48c2-rrv3-qjmp; no automatic force-upgrade was used.

## Drift and deployment

`npm run check:upstream` resolves one chosen ref and compares it with the audited pin, without updating the supported version. After a reviewed pin change, rerun all checks above. GitHub Pages setup and authorization steps are in [README](../README.md). Local static-server success does not establish remote publication.
