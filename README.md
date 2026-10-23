# Backfort Docs & Configurator

Static EN/RU documentation and a browser-local configuration builder for [Backfort](https://github.com/shellharbor/backfort). Production URL: **https://shellharbor.github.io/backfort-docs/**.

Supported CLI: **1.3.0**, audited commit **287f1a4ca80237e99b902ebcf42e57a4346b5ab4**, reviewed **2026-10-23**. The YAML schema version is **1**.

## Development

Node **22.12+** (24 recommended), npm and the committed lockfile:

```sh
npm ci
npm run dev
npm run check
npx playwright install chromium
npm run test:e2e
npm run preview -- --port 4173
```

Both development and preview use **/backfort-docs/**. The build writes an ordinary static `dist/`; no backend or credentials are required. `check` runs ESLint, 69 domain tests and strict TypeScript + Vite production build. Browser journeys use the production build: run `npm run build` before `test:e2e`. `npm run test:pages` repeats them on an ordinary static server with the production prefix and no SPA fallback.

## What the builder supports

- Durable YAML: explicit files or Compose sources; multiple jobs and local/rclone destinations; per-job successful-copy thresholds.
- Quick files and quick-compose: actual supported flags, fixed gzip 6 and no encryption. Backfort writes their recovery configuration after the real run; the browser does not impersonate that runtime file.
- Compression, age, GPG symmetric/asymmetric, GFS/minimum-copy retention; optional systemd timers or `/etc/cron.d` instructions, initially disabled.
- Advanced: symlinks, volumes/helper image, Compose timeouts and five DB adapters, Minisign, executable hooks, expiry, notifications, watchdog and Prometheus.
- Separate diagnostics, actual backup command, full verification, staging-only recovery and prune preview. Copy fallback and configuration download.

Python, Docker and Kubernetes are documented distributions. They do not appear as working runner toggles. Diff, pins, destructive deletion, notification templates, interactive recovery picker and DB apply are documentation-only. See [CLI coverage](docs/cli-options.md).

## Privacy and validation

Everything is generated in memory in the tab, with no API calls, analytics, cookies, localStorage, sessionStorage or URL persistence. Refresh/reset clears the plan. Form fields accept environment **names**, never secret values. Paths, remote names, email addresses and hook arguments in the downloaded YAML still describe infrastructure: handle that file accordingly.

The browser checks schema, supported combinations, integer ranges and obvious path overlap. It cannot check filesystem existence/ownership, realpath/symlinks, free space, server keys, credentials or Docker services. The result is ready for **server checks**, not a verified backup. Full verification and recovery of encrypted copies require recovery material; public recipients alone suffice for writing.

## GitHub Pages

The workflow `.github/workflows/pages.yml` runs checks for PRs and deploys only trusted `main`/manual runs. Only `dist/` is uploaded. Deployment permissions are limited to the deploy job. Action tags were resolved to pinned SHAs on 2026-10-23.

The repository is `shellharbor/backfort-docs`. Pages is configured with **Settings → Pages → Build and deployment → Source: GitHub Actions**. Approved pushes to `main` or manual **Check and deploy Pages** runs publish after all checks succeed. Review the [workflow runs](https://github.com/shellharbor/backfort-docs/actions/workflows/pages.yml) for the current deployment result. Local preview alone does not establish public availability.

## Contract maintenance and testing

```sh
npm run check:upstream
# Explicit comparison only; does not change the supported contract:
npm run check:upstream -- refs/tags/v1.3.0
```

Review parser, validator, fixtures, docs and CLI registry before changing `src/data/upstream.ts`; rerun unit, browser and isolated Linux suites. Ordinary unit/browser tests do not download or execute Backfort. The opt-in suite is documented in [testing](docs/testing.md). Research checkouts and raw test artifacts are ignored and never shipped.

See [upstream audit](docs/upstream-compatibility.md), [testing](docs/testing.md), [CLI reference](docs/cli-options.md), and [design system](docs/design/SYSTEM.md).
