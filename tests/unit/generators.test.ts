import { describe, it, expect } from "vitest";
import { parse } from "yaml";
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import {
  initialPlan,
  applyPreset,
  newJob,
  newDatabase,
  removeDestination,
  type Plan,
} from "../../src/domain/schema";
import { validate, within } from "../../src/domain/validate";
import { generateYaml } from "../../src/domain/generateYaml";
import {
  generateCommands,
  commandArgv,
  recoveryConfig,
} from "../../src/domain/generateCommands";
import { shellQuote, heredoc } from "../../src/domain/shellQuote";
import { generateSchedule } from "../../src/domain/schedule";
import { requiredEnv } from "../../src/domain/compatibility";
const local = () => applyPreset(initialPlan(), "local");
const has = (p: Plan, field: string) =>
  validate(p).some((i) => i.field.includes(field));
describe("durable configuration", () => {
  it("starts without a silently active source", () =>
    expect(generateYaml.bind(null, initialPlan())).toThrow());
  it("round-trips the exact structured schema", () => {
    const p = local();
    expect(validate(p)).toEqual([]);
    expect(parse(generateYaml(p))).toEqual(p.config);
  });
  it("supports multiple paths, jobs and destinations", () => {
    const p = applyPreset(local(), "offsite");
    if (p.config.jobs[0].source.type === "files")
      p.config.jobs[0].source.paths.push("/srv/app2");
    p.config.jobs.push({
      ...newJob("second"),
      source: {
        type: "files",
        paths: ["/srv/second"],
        exclude: [],
        follow_symlinks: false,
      },
    });
    expect(validate(p)).toEqual([]);
    expect(parse(generateYaml(p)).jobs).toHaveLength(2);
  });
  it("keeps host identity stable across all presets and exports", () => {
    const p = local();
    p.config.settings.host_id = "unique-host";
    for (const preset of [
      "local",
      "offsite",
      "encrypted",
      "compose",
      "upgrade",
    ] as const) {
      const next = applyPreset(p, preset);
      expect(next.config.settings.host_id).toBe("unique-host");
      if (next.mode === "durable") generateYaml(next);
      expect(next.config.settings.host_id).toBe("unique-host");
    }
  });
  it.each([0, 2, -1, 1.2, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1])(
    "rejects invalid min_copies %s",
    (n) => {
      const p = local();
      p.config.jobs[0].success.min_copies = n;
      expect(has(p, "min_copies")).toBe(true);
    },
  );
  it("allows the full copies boundary and rejects duplicate targets", () => {
    const p = applyPreset(local(), "offsite");
    expect(validate(p)).toEqual([]);
    p.config.destinations.push({
      ...p.config.destinations[0],
      name: "same-disk",
    });
    expect(has(p, "destinations.2.path")).toBe(true);
  });
  it("removes all destination references without hiding invalid copy floors", () => {
    const p = removeDestination(applyPreset(local(), "offsite"), 1);
    expect(p.config.jobs[0].destinations).toEqual(["local"]);
    expect(has(p, "min_copies")).toBe(true);
  });
  it("rejects duplicate and unknown job references", () => {
    const p = local();
    p.config.jobs[0].destinations = ["local", "local", "missing"];
    expect(has(p, "destinations")).toBe(true);
    p.config.jobs.push(structuredClone(p.config.jobs[0]));
    expect(has(p, "jobs")).toBe(true);
  });
  it.each([
    ["gzip", 1, true],
    ["gzip", 9, true],
    ["gzip", 10, false],
    ["zstd", 19, true],
    ["zstd", 20, false],
    ["zstd", 0, false],
  ] as const)("checks %s level %i", (method, level, ok) => {
    const p = local();
    p.config.jobs[0].compression = { method, level };
    expect(!has(p, "compression")).toBe(ok);
  });
  it("omits compression level for an uncompressed tar", () => {
    const p = local();
    p.config.jobs[0].compression = { method: "none" };
    expect(parse(generateYaml(p)).jobs[0].compression).toEqual({
      method: "none",
    });
  });
  it.each(["keep_last", "min_keep", "max_age_days"] as const)(
    "rejects zero %s",
    (key) => {
      const p = local();
      p.config.jobs[0].retention[key] = 0;
      expect(has(p, "retention." + key)).toBe(true);
    },
  );
  it("accepts zero GFS values and omits disabled age expiry", () => {
    const p = local();
    Object.assign(p.config.jobs[0].retention, {
      keep_daily: 0,
      keep_weekly: 0,
      keep_monthly: 0,
    });
    expect(generateYaml(p)).not.toContain("max_age_days");
  });
  it("rejects an unknown key instead of silently exporting it", () => {
    const p = local();
    Object.assign(p.config.settings, { typo: 1 });
    expect(has(p, "typo")).toBe(true);
  });
});
describe("path boundaries and literal data", () => {
  it.each([
    "/",
    "relative",
    "/srv/../app",
    "/srv/./app",
    "/srv/a\nother",
    "/srv/a\0b",
    "///",
  ])("rejects unsafe source %s", (value) => {
    const p = local();
    if (p.config.jobs[0].source.type === "files")
      p.config.jobs[0].source.paths = [value];
    expect(has(p, "source.paths")).toBe(true);
  });
  it.each(["/srv/app/uploads/backups", "/srv/app/uploads/state"])(
    "rejects recursive writable path %s",
    (path) => {
      const p = local();
      p.config.destinations[0].path = path;
      expect(has(p, "source")).toBe(true);
    },
  );
  it("compares path components", () => {
    expect(within("/srv/app2", "/srv/app")).toBe(false);
    expect(within("/srv//app/data", "/srv/app")).toBe(true);
  });
  it("rejects source-overlapping restore paths", () => {
    const p = local();
    p.restorePath = "/srv/app/uploads/restore";
    expect(has(p, "restorePath")).toBe(true);
  });
  it("preserves Unicode, spaces, apostrophes and YAML-looking strings", () => {
    const p = local();
    if (p.config.jobs[0].source.type === "files") {
      p.config.jobs[0].source.paths = ["/srv/данные/O'Brien app"];
      p.config.jobs[0].source.exclude = [
        "on",
        "off",
        "yes",
        "0123",
        "# note",
        "a: b",
        "<script>alert(1)</script>",
      ];
    }
    expect(parse(generateYaml(p))).toEqual(p.config);
    expect(generateCommands(p).run).not.toContain("данные");
  });
  it("uses a collision-free quoted heredoc delimiter", () => {
    const output = heredoc(
      "BACKFORT_CONFIG\n$(touch probe)\nBACKFORT_CONFIG_END",
    );
    expect(output).toContain("<<'BACKFORT_CONFIG_END_END'");
  });
  it("never exports executable output from invalid state", () => {
    const p = local();
    p.config.jobs[0].success.min_copies = 8;
    expect(() => generateCommands(p)).toThrow();
    expect(() => generateYaml(p)).toThrow();
    expect(() => generateSchedule(p)).toThrow();
  });
  const bash =
    process.platform === "win32"
      ? "C:/Program Files/Git/bin/bash.exe"
      : "/bin/bash";
  it.skipIf(!existsSync(bash))(
    "decodes shell probes into the original argv without executing them",
    () => {
      const probes = [
        "$(printf SHOULD_NOT_RUN)",
        "`printf SHOULD_NOT_RUN`",
        "O'Brien",
        "; printf BAD",
        "a|b",
        "x&y",
        'a "b"',
        "spaces and Unicode данные",
      ];
      const command = "printf '%s\\0' " + probes.map(shellQuote).join(" ");
      const result = spawnSync(bash, ["-c", command], { encoding: "utf8" });
      expect(result.status).toBe(0);
      expect(result.stdout.split("\0").slice(0, -1)).toEqual(probes);
    },
  );
  it("rejects control characters in shell arguments", () =>
    expect(() => shellQuote("a\nb")).toThrow());
});
describe("crypto and advanced contracts", () => {
  it.each(["age", "gpg"] as const)(
    "supports single and multiple %s recipients",
    (method) => {
      const p = local();
      p.config.jobs[0].encryption = {
        method,
        recipient_env: "PUBLIC_RECIPIENT",
      };
      expect(validate(p)).toEqual([]);
      p.config.jobs[0].encryption = {
        method,
        recipients_env: ["PRIMARY", "RECOVERY"],
      };
      expect(validate(p)).toEqual([]);
      p.config.jobs[0].encryption.recipient_env = "BAD_COMBINATION";
      expect(has(p, "encryption")).toBe(true);
    },
  );
  it("supports GPG symmetric without invented method names", () => {
    const p = local();
    p.config.jobs[0].encryption = { method: "gpg", password_env: "PASSPHRASE" };
    expect(parse(generateYaml(p)).jobs[0].encryption.method).toBe("gpg");
    p.config.jobs[0].encryption.identity_password_env = "RECOVERY_PASS";
    expect(has(p, "encryption")).toBe(true);
  });
  it("rejects age password and unsupported recovery fields", () => {
    const p = applyPreset(local(), "encrypted");
    p.config.jobs[0].encryption.password_env = "PASSWORD";
    expect(has(p, "encryption")).toBe(true);
  });
  it("rejects secrets in place of env names", () => {
    const p = local();
    p.config.jobs[0].encryption = {
      method: "gpg",
      password_env: "${PASSWORD}",
    };
    expect(has(p, "password_env")).toBe(true);
  });
  it("keeps hooks as literal argument arrays and signing key names", () => {
    const p = local();
    const j = p.config.jobs[0];
    j.hooks = {
      pre: {
        path: "/usr/local/lib/backfort/hook",
        args: ["$(touch probe)", "a b", "O'Brien"],
        timeout_seconds: 300,
      },
    };
    j.signing = {
      method: "minisign",
      secret_key_env: "SECRET_KEY_FILE",
      public_key_env: "PUBLIC_KEY_TEXT",
    };
    expect(parse(generateYaml(p)).jobs[0].hooks.pre.args).toEqual(
      j.hooks.pre!.args,
    );
    expect(requiredEnv(p)).toContain("SECRET_KEY_FILE");
  });
  it("validates watchdog, metrics and SMTP TLS dependencies", () => {
    const p = local();
    p.config.watchdog = { max_age_hours: 0, jobs: ["missing"] };
    p.config.metrics = { prometheus: { textfile_directory: "relative" } };
    p.config.notifications = {
      enabled: true,
      defaults: { events: ["failure"], antiflood_hours: 4, digest: "off" },
      channels: [],
    };
    expect(has(p, "watchdog")).toBe(true);
    expect(has(p, "metrics")).toBe(true);
    expect(has(p, "channels")).toBe(true);
  });
});
describe("Compose and quick modes", () => {
  it.each(["postgres", "mysql", "mariadb", "mssql", "oracle"] as const)(
    "serializes %s with only engine-specific keys",
    (engine) => {
      const p = applyPreset(local(), "compose");
      if (p.config.jobs[0].source.type === "docker_compose")
        p.config.jobs[0].source.databases = [newDatabase(engine)];
      expect(validate(p)).toEqual([]);
      expect(parse(generateYaml(p)).jobs[0].source.databases[0].engine).toBe(
        engine,
      );
    },
  );
  it("requires a helper for volumes", () => {
    const p = applyPreset(local(), "compose");
    if (p.config.jobs[0].source.type === "docker_compose")
      p.config.jobs[0].source.volumes = ["uploads"];
    expect(has(p, "volume_helper_image")).toBe(true);
  });
  it("quick uses real flags, no -c or protection flags, with a saved recovery config", () => {
    const p = applyPreset(local(), "upgrade");
    p.config.jobs[0].encryption = { method: "age", recipient_env: "RECIPIENT" };
    const c = generateCommands(p);
    const argv = commandArgv(p, "quick", true);
    expect(argv).not.toContain("-c");
    expect(argv).toContain("--dry-run");
    expect(c.run).not.toMatch(/--encrypt|--compression|--retention/);
    expect(recoveryConfig(p)).toBe("/var/lib/backfort-quick/quick/app.yaml");
    expect(c.verify).toContain(recoveryConfig(p));
    expect(() => generateYaml(p)).toThrow();
  });
  it("quick-compose exposes no custom PG format or timeout and requires supported engines", () => {
    const p = applyPreset(local(), "compose");
    p.mode = "quick-compose";
    const a = commandArgv(p, "quick-compose", true);
    expect(a).toContain(
      "app-db:postgres:postgres:backfort:BACKFORT_DB_PASSWORD:app",
    );
    expect(a).not.toContain("--volume-helper-image");
    expect(a).not.toContain("-c");
    if (p.config.jobs[0].source.type === "docker_compose")
      p.config.jobs[0].source.databases = [newDatabase("oracle")];
    expect(has(p, "engine")).toBe(true);
  });
});
describe("schedules", () => {
  it("does not turn unsupported dry-run commands into executable output", () => {
    expect(() => commandArgv(local(), "watchdog", true)).toThrow();
    expect(() => commandArgv(local(), "install")).toThrow();
  });
  it("rejects nested unknown keys before generation", () => {
    const p = local();
    Object.assign(p.config.jobs[0].success, { unexpected: true });
    expect(() => generateYaml(p)).toThrow();
  });
  it("starts off and quick never schedules", () => {
    expect(generateSchedule(local())).toEqual({});
    const p = applyPreset(local(), "upgrade");
    p.schedule.kind = "systemd";
    expect(generateSchedule(p)).toEqual({});
  });
  it("generates separate services/timers without hiding partial exits", () => {
    const p = local();
    p.schedule.kind = "systemd";
    p.schedule.prune = true;
    const s = generateSchedule(p);
    expect(s["backfort.service"]).toContain("User=root");
    expect(s["backfort.service"]).not.toContain("SuccessExitStatus");
    expect(s["backfort-prune.service"]).toContain(" prune");
    expect(s["backfort-prune.timer"]).toContain("08:15:00 UTC");
  });
  it("uses EnvironmentFile for secrets without values", () => {
    const p = applyPreset(local(), "encrypted");
    p.schedule.kind = "systemd";
    expect(generateSchedule(p)["backfort.service"]).toContain(
      "EnvironmentFile=/etc/backfort/backfort.env",
    );
  });
  it.each(["%", "$", "'", '"', "\\", "`"])(
    "rejects unsupported scheduler path character %s",
    (char) => {
      const p = local();
      p.configPath = `/etc/backfort/${char}config.yaml`;
      p.schedule.kind = "cron";
      expect(has(p, "schedule")).toBe(true);
    },
  );
  it("cron has an explicit account, PATH, timezone and environment delivery", () => {
    const p = applyPreset(local(), "encrypted");
    p.schedule.kind = "cron";
    const cron = generateSchedule(p)["backfort.cron"];
    expect(cron).toContain("15 2 * * * root ");
    expect(cron).toContain("EnvironmentFile=");
    expect(cron).not.toContain("source ");
  });
});
