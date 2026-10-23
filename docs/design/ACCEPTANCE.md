# UI acceptance evidence

Verified on 2026-10-23 with Windows, Node 24.17.0 and Chromium via Playwright. A separate in-app browser visual inspection was also performed. The production build is served under `/backfort-docs/`.

| Requirement / state | Status | Evidence |
| --- | --- | --- |
| Overview and terminal composition | browser-verified | In-app browser desktop inspection; overview screenshots in ignored test-results/ |
| EN/RU at 360, 390, 820 and 1280 px | browser-verified | tests/e2e/layout.spec.ts; no body horizontal overflow |
| Durable files journey / Advanced values / language preservation | browser-verified | tests/e2e/journeys.spec.ts |
| Multiple jobs/destinations; removing a used destination | browser-verified | Correct references and invalid copy-floor blocking |
| Encrypted offsite and quick-compose | browser-verified | Summary and actual generated flags checked |
| Download and clipboard fallback | browser-verified | YAML filename/content and fallback selection; clipboard success included in final suite |
| Direct anchors, reload, assets/favicon, keyboard skip link | browser-verified | Prefix journeys; no 404 or console error |
| Automated accessibility | browser-verified | axe 4.14: no violations in the exercised final configuration state after contrast/scroll-focus fixes |
| Reduced motion | source-reviewed | CSS disables scrolling/transition animation; no claim of an exhaustive motion audit |
| Backend/auth/storage | source-reviewed | Not part of this static site; form state only in memory |
| GitHub Pages deployment configuration | source-reviewed | Pages Source = GitHub Actions; current runtime outcome in [workflow runs](https://github.com/shellharbor/backfort-docs/actions/workflows/pages.yml) |
| Ordinary static hosting under /backfort-docs/ | browser-verified | Final npm run test:pages: all 8 scenarios passed, no SPA fallback |

The browser suite records screenshots and traces under ignored `test-results/` and `playwright-report/`. They are evidence for their captured states, not a promise of an exhaustive manual screen-reader assessment. See [testing](../testing.md) for final suite results.
