import type { Plan, Job } from "./schema";
import { activeJobs } from "./compatibility";
import { control } from "./shellQuote";
import { emittedEvents } from "../data/upstream";
export interface Issue {
  field: string;
  code:
    | "required"
    | "identifier"
    | "env"
    | "absolute"
    | "relative"
    | "duplicate"
    | "range"
    | "reference"
    | "overlap"
    | "incompatible"
    | "unknown"
    | "schedule"
    | "text";
  detail?: string;
}
export const identifier = /^[A-Za-z0-9][A-Za-z0-9._-]*$/;
export const envName = /^[A-Za-z_][A-Za-z0-9_]*$/;
export const normalize = (s: string) =>
  "/" + s.split("/").filter(Boolean).join("/");
export const within = (a: string, b: string) =>
  normalize(a) === normalize(b) || normalize(a).startsWith(normalize(b) + "/");
export const absolute = (v: string) =>
  v.startsWith("/") &&
  normalize(v) !== "/" &&
  !control.test(v) &&
  !v.split("/").some((s) => s === "." || s === "..");
export const relative = (v: string) =>
  !!v &&
  !v.startsWith("/") &&
  !control.test(v) &&
  !v.split("/").some((s) => s === "." || s === "..");
export function validate(p: Plan): Issue[] {
  const issues: Issue[] = [];
  const add = (field: string, code: Issue["code"], detail?: string) =>
    issues.push({ field, code, detail });
  const id = (v: string, field: string) => {
    if (!identifier.test(v)) add(field, "identifier");
  };
  const env = (v: string | undefined, field: string) => {
    if (!envName.test(v || "")) add(field, "env");
  };
  const abs = (v: string, field: string) => {
    if (!absolute(v)) add(field, "absolute");
  };
  const rel = (v: string, field: string) => {
    if (!relative(v)) add(field, "relative");
  };
  const int = (
    v: number | undefined,
    min: number,
    max: number,
    field: string,
  ) => {
    if (!Number.isSafeInteger(v) || v! < min || v! > max)
      add(field, "range", `${min}–${max}`);
  };
  const keys = (value: object, allowed: string, field: string) =>
    Object.keys(value).forEach((k) => {
      if (!allowed.split(" ").includes(k)) add(field + "." + k, "unknown");
    });
  const unique = (values: string[], field: string) => {
    if (new Set(values).size !== values.length) add(field, "duplicate");
  };
  if (p.mode === "durable") {
    keys(
      p.config,
      "version settings destinations jobs watchdog metrics notifications",
      "config",
    );
    if (p.config.version !== 1) add("version", "incompatible");
    keys(
      p.config.settings,
      "host_id state_directory temp_directory lock_file min_free_mb",
      "settings",
    );
    id(p.config.settings.host_id, "settings.host_id");
    abs(p.configPath, "configPath");
    abs(p.config.settings.state_directory, "settings.state_directory");
    abs(p.config.settings.temp_directory, "settings.temp_directory");
    abs(p.config.settings.lock_file, "settings.lock_file");
    int(p.config.settings.min_free_mb, 0, 2147483647, "settings.min_free_mb");
  } else abs(p.quickState, "quickState");
  abs(p.restorePath, "restorePath");
  if (!p.config.destinations.length) add("destinations", "required");
  unique(
    p.config.destinations.map((d) => d.name),
    "destinations",
  );
  const targets = new Set<string>();
  p.config.destinations.forEach((d, i) => {
    const f = `destinations.${i}`;
    keys(d, "name type path remote", f);
    id(d.name, f + ".name");
    if (d.type === "local") {
      abs(d.path, f + ".path");
      if (d.remote) add(f + ".remote", "incompatible");
    } else if (d.type === "rclone") {
      id(d.remote || "", f + ".remote");
      rel(d.path, f + ".path");
    } else add(f + ".type", "incompatible");
    const t = d.type + ":" + (d.remote || "") + ":" + normalize(d.path);
    if (targets.has(t)) add(f + ".path", "duplicate");
    targets.add(t);
  });
  const jobs = activeJobs(p);
  if (!jobs.length) add("jobs", "required");
  unique(
    jobs.map((j) => j.name),
    "jobs",
  );
  if (p.job && !jobs.some((j) => j.name === p.job)) add("job", "reference");
  jobs.forEach((j, i) => {
    const f = `jobs.${i}`;
    keys(
      j,
      "name source destinations success compression encryption signing retention hooks",
      f,
    );
    id(j.name, f + ".name");
    keys(j.success, "min_copies", f + ".success");
    if (!j.destinations.length) add(f + ".destinations", "required");
    unique(j.destinations, f + ".destinations");
    j.destinations.forEach((d) => {
      if (!p.config.destinations.some((x) => x.name === d))
        add(f + ".destinations", "reference", d);
    });
    int(
      j.success.min_copies,
      1,
      j.destinations.length,
      f + ".success.min_copies",
    );
    const roots: string[] = [];
    const s = j.source;
    if (s.type === "files") {
      if (typeof s.follow_symlinks !== "boolean")
        add(f + ".source.follow_symlinks", "incompatible");
      keys(s, "type paths exclude follow_symlinks", f + ".source");
      if (p.mode === "quick-compose") add(f + ".source", "incompatible");
      if (!s.paths.length) add(f + ".source.paths", "required");
      s.paths.forEach((v) => abs(v, f + ".source.paths"));
      roots.push(...s.paths);
      s.exclude.forEach((v) => {
        if (control.test(v)) add(f + ".source.exclude", "text");
      });
    } else if (s.type === "docker_compose") {
      keys(
        s,
        "type project_dir files volumes bind_mounts databases volume_helper_image command_timeout_seconds",
        f + ".source",
      );
      if (p.mode === "quick") add(f + ".source", "incompatible");
      abs(s.project_dir, f + ".source.project_dir");
      roots.push(s.project_dir);
      if (!s.files.length) add(f + ".source.files", "required");
      s.files.forEach((v) => rel(v, f + ".source.files"));
      unique(s.volumes, f + ".source.volumes");
      s.volumes.forEach((v) => id(v, f + ".source.volumes"));
      if (p.mode === "durable")
        int(
          s.command_timeout_seconds,
          1,
          86400,
          f + ".source.command_timeout_seconds",
        );
      if (
        s.volumes.length &&
        (!/^[A-Za-z0-9][A-Za-z0-9._/@:-]*$/.test(s.volume_helper_image || "") ||
          s.volume_helper_image?.includes(".."))
      )
        add(f + ".source.volume_helper_image", "required");
      unique(
        s.bind_mounts.map((v) => v.name),
        f + ".source.bind_mounts",
      );
      s.bind_mounts.forEach((b, k) => {
        keys(b, "name path", f + ".source.bind_mounts." + k);
        id(b.name, f + ".source.bind_mounts." + k + ".name");
        rel(b.path, f + ".source.bind_mounts." + k + ".path");
        if (p.mode === "quick-compose" && b.path.includes(":"))
          add(f + ".source.bind_mounts." + k + ".path", "incompatible");
      });
      unique(
        s.databases.map((v) => v.name),
        f + ".source.databases",
      );
      s.databases.forEach((d, k) => {
        const df = f + ".source.databases." + k;
        const extra =
          d.engine === "postgres"
            ? "databases include_globals format"
            : d.engine === "oracle"
              ? "connect directory path"
              : d.engine === "mssql"
                ? "databases backup_directory"
                : "databases";
        keys(d, "name service engine user password_env " + extra, df);
        id(d.name, df + ".name");
        id(d.service, df + ".service");
        id(d.user, df + ".user");
        env(d.password_env, df + ".password_env");
        if (
          !["postgres", "mysql", "mariadb", "mssql", "oracle"].includes(
            d.engine,
          )
        )
          add(df + ".engine", "incompatible");
        if (
          p.mode !== "durable" &&
          !["postgres", "mysql", "mariadb"].includes(d.engine)
        )
          add(df + ".engine", "incompatible");
        if (d.engine === "oracle") {
          id(d.connect || "", df + ".connect");
          id(d.directory || "", df + ".directory");
          abs(d.path || "", df + ".path");
        } else {
          if (!d.databases?.length) add(df + ".databases", "required");
          d.databases?.forEach((v) => id(v, df + ".databases"));
        }
        if (d.engine === "mssql")
          abs(d.backup_directory || "", df + ".backup_directory");
        if (
          d.engine === "postgres" &&
          d.format &&
          !["custom", "sql"].includes(d.format)
        )
          add(df + ".format", "incompatible");
      });
    } else add(f + ".source.type", "incompatible");
    const writable = p.config.destinations
      .filter((d) => d.type === "local")
      .map((d) => d.path);
    writable.push(
      ...(p.mode === "durable"
        ? [
            p.config.settings.state_directory,
            p.config.settings.temp_directory,
            p.config.settings.lock_file,
            p.configPath,
          ]
        : [p.quickState]),
    );
    writable.forEach((path) => {
      if (
        roots.some(
          (root) =>
            absolute(root) && (within(path, root) || within(root, path)),
        )
      )
        add(f + ".source", "overlap", path);
    });
    [...roots, ...writable].forEach((path) => {
      if (
        absolute(path) &&
        (within(p.restorePath, path) || within(path, p.restorePath))
      )
        add("restorePath", "overlap", path);
    });
    if (p.mode !== "durable") return;
    validateProtection(j, f);
  });
  function validateProtection(j: Job, f: string) {
    keys(j.compression, "method level", f + ".compression");
    if (!["gzip", "zstd", "none"].includes(j.compression.method))
      add(f + ".compression.method", "incompatible");
    if (j.compression.method !== "none")
      int(
        j.compression.level,
        1,
        j.compression.method === "gzip" ? 9 : 19,
        f + ".compression.level",
      );
    else if (j.compression.level !== undefined)
      add(f + ".compression.level", "incompatible");
    const e = j.encryption;
    keys(
      e,
      "method recipient_env recipients_env identity_file_env password_env identity_password_env",
      f + ".encryption",
    );
    if (!["none", "age", "gpg"].includes(e.method))
      add(f + ".encryption.method", "incompatible");
    const recipients = !!e.recipient_env || !!e.recipients_env?.length;
    if (e.recipient_env && e.recipients_env)
      add(f + ".encryption", "incompatible");
    if (e.method === "none" && Object.keys(e).length > 1)
      add(f + ".encryption", "incompatible");
    if (
      e.method === "age" &&
      (!recipients || e.password_env || e.identity_password_env)
    )
      add(f + ".encryption", "incompatible");
    if (
      e.method === "gpg" &&
      ((!recipients && !e.password_env) ||
        (recipients && e.password_env) ||
        e.identity_file_env ||
        (e.password_env && e.identity_password_env))
    )
      add(f + ".encryption", "incompatible");
    Object.entries(e).forEach(([k, v]) => {
      if (k.endsWith("_env") && typeof v === "string")
        env(v, f + ".encryption." + k);
    });
    if (e.recipients_env) {
      if (!e.recipients_env.length)
        add(f + ".encryption.recipients_env", "required");
      unique(e.recipients_env, f + ".encryption.recipients_env");
      e.recipients_env.forEach((v) => env(v, f + ".encryption.recipients_env"));
    }
    keys(j.signing, "method secret_key_env public_key_env", f + ".signing");
    if (j.signing.method === "minisign") {
      env(j.signing.secret_key_env, f + ".signing.secret_key_env");
      env(j.signing.public_key_env, f + ".signing.public_key_env");
    } else if (j.signing.method !== "none" || Object.keys(j.signing).length > 1)
      add(f + ".signing", "incompatible");
    keys(
      j.retention,
      "keep_last keep_daily keep_weekly keep_monthly min_keep max_age_days",
      f + ".retention",
    );
    Object.entries(j.retention).forEach(([k, v]) =>
      int(
        v,
        ["keep_last", "min_keep", "max_age_days"].includes(k) ? 1 : 0,
        2147483647,
        f + ".retention." + k,
      ),
    );
    if (j.hooks) {
      keys(j.hooks, "pre post", f + ".hooks");
      Object.entries(j.hooks).forEach(([phase, h]) => {
        if (!h) return;
        keys(h, "path args timeout_seconds", f + ".hooks." + phase);
        abs(h.path, f + ".hooks." + phase + ".path");
        h.args.forEach((a) => {
          if (control.test(a)) add(f + ".hooks." + phase + ".args", "text");
        });
        int(
          h.timeout_seconds,
          1,
          86400,
          f + ".hooks." + phase + ".timeout_seconds",
        );
      });
    }
  }
  if (p.mode === "durable") {
    if (p.config.watchdog) {
      keys(p.config.watchdog, "max_age_hours jobs", "watchdog");
      int(p.config.watchdog.max_age_hours, 1, 8760, "watchdog.max_age_hours");
      p.config.watchdog.jobs?.forEach((j) => {
        if (!jobs.some((v) => v.name === j))
          add("watchdog.jobs", "reference", j);
      });
    }
    if (p.config.metrics) {
      keys(p.config.metrics, "prometheus", "metrics");
      keys(
        p.config.metrics.prometheus,
        "textfile_directory",
        "metrics.prometheus",
      );
      abs(
        p.config.metrics.prometheus.textfile_directory,
        "metrics.prometheus.textfile_directory",
      );
    }
    const n = p.config.notifications;
    if (n) {
      keys(n, "enabled defaults channels", "notifications");
      keys(
        n.defaults,
        "events antiflood_hours digest",
        "notifications.defaults",
      );
      if (typeof n.enabled !== "boolean")
        add("notifications.enabled", "incompatible");
      if (n.enabled && !n.channels.length)
        add("notifications.channels", "required");
      unique(
        n.channels.map((c) => c.name),
        "notifications.channels",
      );
      int(
        n.defaults.antiflood_hours,
        0,
        8760,
        "notifications.defaults.antiflood_hours",
      );
      if (!["off", "daily"].includes(n.defaults.digest))
        add("notifications.defaults.digest", "incompatible");
      if (
        !n.defaults.events.length ||
        n.defaults.events.some((e) => !emittedEvents.includes(e))
      )
        add("notifications.defaults.events", "incompatible");
      n.channels.forEach((c, i) => {
        const f = `notifications.channels.${i}`;
        id(c.name, f + ".name");
        const extras = {
          telegram: "token_env chat_id_env thread_id_env",
          ntfy: "server topic_env priority",
          webhook: "url_env headers_env",
          smtp: "host port tls_mode username_env password_env to from",
        };
        keys(c, "name type " + extras[c.type], f);
        if (!Object.hasOwn(extras, c.type)) add(f + ".type", "incompatible");
        Object.entries(c).forEach(([k, v]) => {
          if (k.endsWith("_env")) env(v as string, f + "." + k);
        });
        const required =
          {
            telegram: ["token_env", "chat_id_env"],
            ntfy: ["topic_env"],
            webhook: ["url_env"],
            smtp: ["username_env", "password_env"],
          }[c.type] || [];
        required.forEach((k) =>
          env(c[k as keyof typeof c] as string, f + "." + k),
        );
        if (c.type === "ntfy") {
          try {
            const u = new URL(c.server || "");
            if (
              u.protocol !== "https:" ||
              u.username ||
              u.password ||
              u.search ||
              u.hash
            )
              add(f + ".server", "text");
          } catch {
            add(f + ".server", "text");
          }
          if (
            !["min", "low", "default", "high", "max", "urgent"].includes(
              c.priority || "",
            )
          )
            add(f + ".priority", "incompatible");
        }
        if (c.type === "smtp") {
          if (!/^[A-Za-z0-9][A-Za-z0-9.-]*$/.test(c.host || ""))
            add(f + ".host", "text");
          int(c.port, 1, 65535, f + ".port");
          if (!["starttls", "implicit"].includes(c.tls_mode || ""))
            add(f + ".tls_mode", "incompatible");
          const email = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (
            !email.test(c.from || "") ||
            !c.to?.length ||
            c.to.some((v) => !email.test(v))
          )
            add(f + ".to", "text");
        }
      });
    }
  }
  if (p.schedule.kind !== "none" && p.mode === "durable") {
    if (
      !/^([01]\d|2[0-3]):[0-5]\d$/.test(p.schedule.time) ||
      !/^[A-Za-z_][A-Za-z0-9_-]*$/.test(p.schedule.account) ||
      !/^[A-Za-z0-9_+/-]+$/.test(p.schedule.timezone)
    )
      add("schedule", "schedule");
    try {
      new Intl.DateTimeFormat("en", { timeZone: p.schedule.timezone }).format();
    } catch {
      add("schedule", "schedule");
    }
    int(p.schedule.delay, 0, 86400, "schedule.delay");
    if (
      [p.configPath, p.job, p.schedule.timezone].some((v) =>
        /[%$'"\\`]/.test(v),
      )
    )
      add("schedule", "schedule");
  }
  return issues;
}
export function assertValid(p: Plan) {
  const issues = validate(p);
  if (issues.length)
    throw new Error(issues.map((x) => x.field + ": " + x.code).join("; "));
}
