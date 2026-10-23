# Upstream compatibility audit

Audit date: **2026-10-23**. Repository: [shellharbor/backfort](https://github.com/shellharbor/backfort). CLI **1.3.0** at **287f1a4ca80237e99b902ebcf42e57a4346b5ab4**; the remote `main` SHA matched during this session. YAML **version: 1** is a separate contract. Reference: LaraShip Docs at **1744157154e84a1829591deb918c8b1fd625ba48**.

## Mapping

All links below resolve to the audited commit, not floating main.

| UI / generator | YAML / CLI | Source of truth |
| --- | --- | --- |
| Host/state/temp/lock/free space | settings.*; config path is CLI -c | [validate_config](https://github.com/shellharbor/backfort/blob/287f1a4ca80237e99b902ebcf42e57a4346b5ab4/backfort.sh#L1057) |
| Files and symlinks | source.type=files; paths/exclude/follow_symlinks | backfort.sh: validate_files_source |
| Compose/manifests/binds/volumes | source.type=docker_compose; explicit lists, helper, timeout | backfort.sh: validate_docker_compose_source |
| PG/MySQL/MariaDB/MSSQL/Oracle | source.databases; engine-specific keys only | backfort.sh: validate_compose_database_source |
| Multiple destinations/copies | destinations; job.destinations; success.min_copies | backfort.sh: validate_config |
| Compression/encryption/signing | compression, encryption, signing | backfort.sh: validate_config; [example](https://github.com/shellharbor/backfort/blob/287f1a4ca80237e99b902ebcf42e57a4346b5ab4/config.example.yaml) |
| GFS/expiry/floor | retention.*; separate prune | backfort.sh: validate_config; wiki/Retention-Pins-and-Deletion.md |
| Literal executable hooks | hooks.pre/post.path,args,timeout_seconds | backfort.sh: validate_job_hook, validate_hook_file |
| Channels/notifications | top-level notifications | backfort.sh: validate_notifications_config, bf_notify, notification_deliver_digest |
| Watchdog/metrics | watchdog, metrics.prometheus | backfort.sh: validate_watchdog_config, validate_metrics_config |
| Quick flags/recovery path | quick/quick-compose; no explicit -c | [parse_global_options / parse_command_options](https://github.com/shellharbor/backfort/blob/287f1a4ca80237e99b902ebcf42e57a4346b5ab4/backfort.sh#L7158); quick_write_config, quick_save_config |
| Verify/staged restore | verify latest --job --full; restore[-compose] --to | backfort.sh: parse_command_options; wiki/Restore-and-Verification.md |
| Installation | pinned checkout → reviewed backfort.sh | README.md; no privileged installer executed |
| Python launcher | bundled Bash engine, Linux, Python 3.11+ | [src/backfort/cli.py](https://github.com/shellharbor/backfort/blob/287f1a4ca80237e99b902ebcf42e57a4346b5ab4/src/backfort/cli.py) |

## Site choices versus engine defaults

- No initial source path: users must enter one or deliberately load a preset. Presets visibly identify `/srv/app/uploads`, `/srv/app`, local paths and `company-s3` as examples.
- Stable host example `web-01`; presets preserve the current ID. Automatic selectors are host-scoped; an explicit full backup ID permits deliberate cross-host recovery.
- `min_free_mb: 512`; engine default when omitted is 0. This is not an archive-size calculation.
- GFS preset 3/7/4/6, `min_keep: 1`; engine defaults 3/0/0/0 with min_keep 1. Disabled max_age_days is omitted, never zero.
- Browser integer cap 2,147,483,647 and control-byte/path checks are deliberately stricter. Browser rejects obvious source/storage/recovery overlap both directions; server realpath checks are still essential.
- Browser SMTP recipients require conventional dotted-domain email addresses. ntfy server requires HTTPS without userinfo/query/fragment. These are builder constraints, not claims about all engine inputs.
- Schedule builder rejects `%`, `$`, quotes, backslashes and backticks in config paths. Bash quoting alone does not escape cron/systemd syntax. Ordinary unscheduled commands accept literal spaces, Unicode and apostrophes.
- Unknown keys fail browser validation. UI transitions replace engine-specific objects rather than retaining hidden keys. Advanced toggles change visibility and retain active values in summary/YAML.

## Findings and limits

1. Upstream `scripts/install.sh` and `scripts/install.ps1` install **AI Kit templates**, selecting PHP/Laravel/Moodle/Go. They are not Backfort installers. Confirmed by source inspection and excluded from the installation flow; upstream is unchanged.
2. Both GPG modes serialize `method: gpg`. Symmetric password and public-recipient modes are mutually exclusive. Age uses recipient_env or recipients_env and optional recovery identity_file_env; only asymmetric GPG supports identity_password_env. Secret values and key generation are outside the browser.
3. Quick fixes gzip 6, encryption none, no signing/hooks/custom retention; recovery config is saved only by a real run and can be replaced by reusing the name. Quick PostgreSQL is plain SQL, durable defaults to custom. Quick helper is emitted only with volumes. No browser YAML is labeled as the exact runtime quick config.
4. `.complete` is required for a ready copy. Quick verify does not decrypt; full verification needs recovery material and per-file checks are limited to bundles carrying those hashes.
5. Compose is explicit, not automatic discovery of `.env`, all mounts or DBs. Helpers must be preloaded with tar/timeout. Default recovery only stages data. DB apply is separate, changes targets, needs a fresh staging path, confirm and project-dir, cannot dry-run and does not support MSSQL/Oracle. PG globals are manual.
6. Parser accepts `drill_failure` notification events but no automatic recovery-drill emitter was found. It is not offered in the UI. Daily digest flushes on a later Backfort event, rather than on an independent scheduler. UI offers the eight ordinary emitted events.
7. Template whitelist in this commit: event, job, id, host, size, duration, exit_code, error, destinations, failed_destinations, target, last_backup_age, threshold, pinned_count, freed, restore_hint. The renderer's internal `extra` value is not in the template validator whitelist and is not advertised as a custom placeholder.
8. PyPI publication and container registry digest were not verified. GitHub release assets do not establish them. Alternative runners remain documentation links without runnable installation/container snippets or a misleading adapter toggle.
9. Exit 1 is a partial destination result only when the success threshold is met. Some saved-job preflight failures return 3 where doctor returns 2; no universal environment-error-to-exit-2 promise is made.

## Evidence and drift

See [testing](testing.md) for actual executed/remaining checks. `npm run check:upstream` compares one remote ref against the audited full commit and reports drift without changing the supported contract. Changing the pin requires manual parser/schema review and the full suites.

At initial implementation, the target repository was confirmed public and empty (`size: 0`) and this workspace had no Git checkout. Publication was subsequently authorized explicitly. GitHub Pages is configured for the existing repository with Actions as the build source. Deployment outcomes are recorded by the [Pages workflow](https://github.com/shellharbor/backfort-docs/actions/workflows/pages.yml), separately from the upstream engine compatibility evidence.
