# Changelog

## Unreleased

### Deployment

- Prepared the initial source release for `shellharbor/backfort-docs` and configured GitHub Pages to publish trusted `main` runs through Actions.
- Normalized repository text to LF for reproducible Linux checks and deployment.

### Added

- Static Backfort Docs site and a five-step EN/RU configuration builder, based on audited CLI 1.3.0 and YAML schema 1.
- Durable files/Compose, quick modes, multiple jobs/destinations, crypto, retention and Advanced controls, with separate backup/verification/staging/prune workflows.
- Installation/recovery/reference/FAQ, optional systemd/cron files, clipboard fallback and configuration download without browser persistence or secret inputs.
- Strict schema/path/compatibility checks, safe literal argv and YAML serialization, 69 domain tests, browser/mobile/accessibility journeys and a pinned isolated upstream integration suite.
- GitHub Pages workflow, compatibility/testing/design documentation and upstream-drift detection.

### Fixed during validation

- Direct-anchor entry after React mount, narrow-grid overflow, code-scroll keyboard focus and muted-text contrast.
- Multiline editing now retains a trailing newline while adding a second path; Advanced database choices and notices remain accurate after visibility/language changes.
- YAML dependency updated to 2.9.1 after reviewing the nesting advisory; dependency audit is clean.
