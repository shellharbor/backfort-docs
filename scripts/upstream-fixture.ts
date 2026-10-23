import {
  mkdtempSync,
  writeFileSync,
  readFileSync,
  mkdirSync,
  rmSync,
  existsSync,
} from "node:fs";
import { parse } from "yaml";
import { tmpdir } from "node:os";
import { join, resolve, sep } from "node:path";
import { spawnSync } from "node:child_process";
import { applyPreset, initialPlan, newDatabase } from "../src/domain/schema";
import { generateYaml } from "../src/domain/generateYaml";
import { commandArgv } from "../src/domain/generateCommands";
import { upstream } from "../src/data/upstream";
const checkout = resolve(process.argv[2]);
function exec(binary: string, args: string[], expected = 0) {
  const r = spawnSync(binary, args, { encoding: "utf8", timeout: 60000 });
  if (r.status !== expected)
    throw new Error(
      `${binary} returned ${r.status}; expected ${expected}\n${r.stdout}\n${r.stderr}`,
    );
  return r.stdout;
}
if (
  exec("git", ["-C", checkout, "rev-parse", "HEAD"]).trim() !== upstream.commit
)
  throw new Error("Audited checkout commit mismatch");
const root = mkdtempSync(join(tmpdir(), "backfort-docs-"));
if (!root.startsWith(resolve(tmpdir()) + sep + "backfort-docs-"))
  throw new Error("Invalid fixture root");
const file = (name: string) => join(root, name);
try {
  const engine = file("backfort.sh");
  writeFileSync(
    engine,
    exec("git", ["-C", checkout, "show", `${upstream.commit}:backfort.sh`]),
  );
  for (const dir of ["source", "destination", "state", "temp", "recovery"])
    mkdirSync(file(dir));
  writeFileSync(
    file("source/data.txt"),
    "synthetic fixture — data to recover\n",
  );
  writeFileSync(file("source/exclude.log"), "must be excluded\n");
  const p = applyPreset(initialPlan(), "local");
  p.config.settings = {
    host_id: "fixture-host",
    state_directory: file("state"),
    temp_directory: file("temp"),
    lock_file: file("backfort.lock"),
    min_free_mb: 0,
  };
  p.configPath = file("config.yaml");
  p.restorePath = file("recovery/restored");
  p.config.destinations[0].path = file("destination");
  if (p.config.jobs[0].source.type === "files") {
    p.config.jobs[0].source.paths = [file("source")];
    p.config.jobs[0].source.exclude = ["*.log"];
  }
  writeFileSync(p.configPath, generateYaml(p));
  const run = (command: string, dry = false) =>
    exec("bash", [engine, ...commandArgv(p, command, dry).slice(2)]);
  run("doctor");
  run("run", true);
  run("run");
  run("verify");
  run("restore");
  const restored = file("recovery/restored") + file("source/data.txt");
  if (
    readFileSync(restored, "utf8") !==
    readFileSync(file("source/data.txt"), "utf8")
  )
    throw new Error("Restored content mismatch");
  if (existsSync(file("recovery/restored") + file("source/exclude.log")))
    throw new Error("Excluded file was restored");
  if (
    readFileSync(file("source/data.txt"), "utf8") !==
    "synthetic fixture — data to recover\n"
  )
    throw new Error("Source changed");
  console.log(
    "PASS: generated YAML doctor, dry-run, real local backup, full verify, staged restore, data/exclusions and unchanged source.",
  );
  const q = structuredClone(p);
  q.mode = "quick";
  q.quickState = file("quick-state");
  q.restorePath = file("recovery/quick-restored");
  exec("bash", [engine, ...commandArgv(q, "quick", true).slice(2)]);
  if (existsSync(file("quick-state/quick/app.yaml")))
    throw new Error("Quick dry-run unexpectedly persisted a config");
  exec("bash", [engine, ...commandArgv(q, "quick").slice(2)]);
  if (!existsSync(file("quick-state/quick/app.yaml")))
    throw new Error("Quick recovery config missing");
  exec("bash", [engine, ...commandArgv(q, "verify").slice(2)]);
  exec("bash", [engine, ...commandArgv(q, "restore").slice(2)]);
  if (
    readFileSync(
      file("recovery/quick-restored") + file("source/data.txt"),
      "utf8",
    ) !== readFileSync(file("source/data.txt"), "utf8")
  )
    throw new Error("Quick recovery mismatch");
  console.log(
    "PASS: quick real flags, dry-run non-persistence, saved recovery YAML, full verify and recovery.",
  );
  // Extract only definitions; never call main or privileged installers. Exercise actual validators
  // without Docker/cloud dependencies, in this same synthetic root.
  const source = readFileSync(engine, "utf8");
  const cut = source.lastIndexOf('\nmain "$@"');
  if (cut < 0) throw new Error("Cannot isolate upstream definitions");
  const validator = file("validate.sh");
  writeFileSync(
    validator,
    source.slice(0, cut) +
      `\nCONFIG_FILE=$1\nmake_config_cache_file\nvalidate_config\n`,
  );
  // Dependency-free parser probes fail before configuration/runtime work.
  for (const args of [
    ["--config", "x", "run"],
    ["-c", p.configPath, "quick", file("source"), "--to", file("destination")],
    ["quick", file("source"), "--to", file("destination"), "--encrypt", "age"],
    ["--dry-run", "watchdog", "--max-age", "26"],
    ["--dry-run", "diff", "a", "b"],
  ])
    exec("bash", [engine, ...args], 2);
  console.log(
    "PASS: upstream parser rejects invented options and forbidden combinations.",
  );
  // Exercise schemas through the original validator before isolated fake integrations.
  for (const engineType of [
    "postgres",
    "mysql",
    "mariadb",
    "mssql",
    "oracle",
  ] as const) {
    const c = structuredClone(p);
    c.config.jobs[0].source = {
      type: "docker_compose",
      project_dir: file("source"),
      files: ["compose.yaml"],
      volumes: [],
      bind_mounts: [],
      databases: [newDatabase(engineType)],
      command_timeout_seconds: 3600,
    };
    const config = file(`compose-${engineType}.yaml`);
    writeFileSync(config, generateYaml(c));
    exec("bash", [validator, config]);
  }
  console.log(
    "PASS: all five generated Compose database schemas accepted by the actual validator (no live Docker).",
  );
  for (const encryption of [
    { method: "age" as const, recipient_env: "AGE_RECIPIENT" },
    {
      method: "age" as const,
      recipients_env: ["PRIMARY", "RECOVERY"],
      identity_file_env: "AGE_IDENTITY",
    },
    { method: "gpg" as const, password_env: "GPG_PASSWORD" },
    {
      method: "gpg" as const,
      recipients_env: ["GPG_PRIMARY", "GPG_RECOVERY"],
      identity_password_env: "GPG_IDENTITY_PASSWORD",
    },
  ]) {
    const c = structuredClone(p);
    c.config.jobs[0].encryption = encryption;
    c.config.jobs[0].signing = {
      method: "minisign",
      secret_key_env: "SIGNING_KEY_FILE",
      public_key_env: "SIGNING_PUBLIC_TEXT",
    };
    c.config.jobs[0].hooks = {
      pre: {
        path: file("trusted-hook"),
        args: ["literal arg", "O'Brien"],
        timeout_seconds: 300,
      },
    };
    c.config.watchdog = { max_age_hours: 26, jobs: ["app"] };
    c.config.metrics = { prometheus: { textfile_directory: file("metrics") } };
    c.config.notifications = {
      enabled: true,
      defaults: {
        events: ["failure", "partial", "recovery", "watchdog"],
        antiflood_hours: 4,
        digest: "daily",
      },
      channels: [
        {
          name: "telegram",
          type: "telegram",
          token_env: "TG_TOKEN",
          chat_id_env: "TG_CHAT",
        },
        { name: "webhook", type: "webhook", url_env: "WEBHOOK_URL" },
        {
          name: "ntfy",
          type: "ntfy",
          server: "https://ntfy.example.net",
          topic_env: "NTFY_TOPIC",
          priority: "urgent",
        },
        {
          name: "smtp",
          type: "smtp",
          host: "smtp.example.net",
          port: 587,
          tls_mode: "starttls",
          username_env: "SMTP_USER",
          password_env: "SMTP_PASS",
          to: ["ops@example.net"],
          from: "backfort@example.net",
        },
      ],
    };
    const config = file("advanced.yaml");
    writeFileSync(config, generateYaml(c));
    exec("bash", [validator, config]);
  }
  console.log(
    "PASS: age/GPG single/multiple recipients, signing, hooks, four channel types, metrics and watchdog schemas accepted by the real validator.",
  );
  const bin = file("fake-bin");
  mkdirSync(bin);
  for (const name of ["docker", "rclone"])
    writeFileSync(
      join(bin, name),
      exec("git", [
        "-C",
        checkout,
        "show",
        `${upstream.commit}:tests/fake-${name}.sh`,
      ]),
      { mode: 0o700 },
    );
  process.env.PATH = bin + ":" + process.env.PATH;
  process.env.BACKFORT_FAKE_DOCKER_ROOT = file("fake-docker");
  process.env.BACKFORT_FAKE_DOCKER_LOG = file("fake-docker.log");
  process.env.BACKFORT_FAKE_RCLONE_ROOT = file("fake-remotes");
  process.env.BACKFORT_DB_PASSWORD = "synthetic-fixture-only";
  for (const dir of [
    "source/uploads",
    "fake-docker/volumes/fake_media",
    "fake-remotes",
    "compose-destination",
    "compose-state",
    "compose-temp",
  ])
    mkdirSync(file(dir), { recursive: true });
  writeFileSync(file("source/uploads/asset.txt"), "synthetic upload\n");
  writeFileSync(
    file("fake-docker/volumes/fake_media/media.txt"),
    "synthetic volume\n",
  );
  writeFileSync(
    file("source/compose.yaml"),
    "services:\n  app: {image: example/app:1}\n  postgres: {image: postgres:17}\nvolumes:\n  media: {}\n",
  );
  const c = structuredClone(p);
  c.configPath = file("compose.yaml");
  c.restorePath = file("recovery/compose-restored");
  c.config.settings = {
    ...p.config.settings,
    state_directory: file("compose-state"),
    temp_directory: file("compose-temp"),
    lock_file: file("compose.lock"),
  };
  c.config.destinations = [
    { name: "local", type: "local", path: file("compose-destination") },
    {
      name: "offsite",
      type: "rclone",
      remote: "fake",
      path: "backups/fixture",
    },
  ];
  c.config.jobs[0].destinations = ["local", "offsite"];
  c.config.jobs[0].success.min_copies = 2;
  c.config.jobs[0].source = {
    type: "docker_compose",
    project_dir: file("source"),
    files: ["compose.yaml"],
    volumes: ["media"],
    volume_helper_image: "example/helper:1",
    bind_mounts: [{ name: "uploads", path: "uploads" }],
    databases: [newDatabase()],
    command_timeout_seconds: 3600,
  };
  writeFileSync(c.configPath, generateYaml(c));
  for (const [cmd, dry] of [
    ["doctor", false],
    ["run", true],
    ["run", false],
    ["verify", false],
    ["restore-compose", false],
  ] as const)
    exec("bash", [engine, ...commandArgv(c, cmd, dry).slice(2)]);
  if (!readFileSync(file("fake-docker.log"), "utf8").includes("pg_dump"))
    throw new Error("Fake PG dump not exercised");
  console.log(
    "PASS: generated Compose + PostgreSQL, explicit bind and volume, local+rclone min_copies=2, real bundle/verify/staging with pinned fake helpers. No live socket/cloud.",
  );
  const qc = structuredClone(c);
  qc.mode = "quick-compose";
  qc.quickState = file("quick-compose-state");
  qc.restorePath = file("recovery/quick-compose-restored");
  exec("bash", [engine, ...commandArgv(qc, "quick-compose").slice(2)]);
  const saved = parse(
    readFileSync(file("quick-compose-state/quick-compose/app.yaml"), "utf8"),
  );
  if (saved.jobs[0].source.databases[0].format !== "sql")
    throw new Error("Quick PostgreSQL must use SQL format");
  exec("bash", [engine, ...commandArgv(qc, "verify").slice(2)]);
  exec("bash", [engine, ...commandArgv(qc, "restore-compose").slice(2)]);
  console.log(
    "PASS: actual generated quick-compose argv, persisted SQL-dump recovery configuration, full verify and Compose staging against fake helpers.",
  );
  console.log(
    "SKIP: live Docker/cloud accounts, age/Minisign real encryption/signing, MSSQL/Oracle vendor import and external notification delivery.",
  );
} finally {
  const checked = resolve(root);
  if (checked.startsWith(resolve(tmpdir()) + sep + "backfort-docs-"))
    rmSync(checked, { recursive: true, force: true });
  else console.error("Refused fixture cleanup outside temporary root");
}
