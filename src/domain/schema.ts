export type Mode = "durable" | "quick" | "quick-compose";
export type Engine = "postgres" | "mysql" | "mariadb" | "mssql" | "oracle";
export interface Database {
  name: string;
  service: string;
  engine: Engine;
  user: string;
  password_env: string;
  databases?: string[];
  include_globals?: boolean;
  format?: "custom" | "sql";
  backup_directory?: string;
  connect?: string;
  directory?: string;
  path?: string;
}
export interface FilesSource {
  type: "files";
  paths: string[];
  exclude: string[];
  follow_symlinks: boolean;
}
export interface ComposeSource {
  type: "docker_compose";
  project_dir: string;
  files: string[];
  volumes: string[];
  bind_mounts: { name: string; path: string }[];
  databases: Database[];
  volume_helper_image?: string;
  command_timeout_seconds: number;
}
export interface Destination {
  name: string;
  type: "local" | "rclone";
  path: string;
  remote?: string;
}
export interface Encryption {
  method: "none" | "age" | "gpg";
  recipient_env?: string;
  recipients_env?: string[];
  identity_file_env?: string;
  password_env?: string;
  identity_password_env?: string;
}
export interface Hook {
  path: string;
  args: string[];
  timeout_seconds: number;
}
export interface Job {
  name: string;
  source: FilesSource | ComposeSource;
  destinations: string[];
  success: { min_copies: number };
  compression: { method: "gzip" | "zstd" | "none"; level?: number };
  encryption: Encryption;
  signing: {
    method: "none" | "minisign";
    secret_key_env?: string;
    public_key_env?: string;
  };
  retention: {
    keep_last: number;
    keep_daily: number;
    keep_weekly: number;
    keep_monthly: number;
    min_keep: number;
    max_age_days?: number;
  };
  hooks?: { pre?: Hook; post?: Hook };
}
export type ChannelType = "telegram" | "ntfy" | "webhook" | "smtp";
export interface Channel {
  name: string;
  type: ChannelType;
  token_env?: string;
  chat_id_env?: string;
  thread_id_env?: string;
  server?: string;
  topic_env?: string;
  priority?: string;
  url_env?: string;
  headers_env?: string;
  host?: string;
  port?: number;
  tls_mode?: "starttls" | "implicit";
  username_env?: string;
  password_env?: string;
  to?: string[];
  from?: string;
}
export interface Config {
  version: 1;
  settings: {
    host_id: string;
    state_directory: string;
    temp_directory: string;
    lock_file: string;
    min_free_mb: number;
  };
  destinations: Destination[];
  jobs: Job[];
  watchdog?: { max_age_hours: number; jobs?: string[] };
  metrics?: { prometheus: { textfile_directory: string } };
  notifications?: {
    enabled: boolean;
    defaults: {
      events: string[];
      antiflood_hours: number;
      digest: "off" | "daily";
    };
    channels: Channel[];
  };
}
export interface Plan {
  mode: Mode;
  config: Config;
  configPath: string;
  quickState: string;
  job: string;
  restorePath: string;
  schedule: {
    kind: "none" | "systemd" | "cron";
    time: string;
    timezone: string;
    account: string;
    persistent: boolean;
    delay: number;
    prune: boolean;
  };
}
export const filesSource = (): FilesSource => ({
  type: "files",
  paths: [],
  exclude: [],
  follow_symlinks: false,
});
export const composeSource = (): ComposeSource => ({
  type: "docker_compose",
  project_dir: "/srv/app",
  files: ["compose.yaml"],
  volumes: [],
  bind_mounts: [],
  databases: [],
  command_timeout_seconds: 3600,
});
export const newDatabase = (engine: Engine = "postgres"): Database => ({
  name: "app-db",
  service: "postgres",
  engine,
  user: "backfort",
  password_env: "BACKFORT_DB_PASSWORD",
  ...(engine === "oracle"
    ? {
        connect: "ORCL",
        directory: "BACKFORT_DIR",
        path: "/var/backups/backfort",
      }
    : { databases: ["app"] }),
  ...(engine === "postgres"
    ? { include_globals: false, format: "custom" }
    : {}),
  ...(engine === "mssql" ? { backup_directory: "/var/opt/mssql/backup" } : {}),
});
export const newJob = (name = "app"): Job => ({
  name,
  source: filesSource(),
  destinations: ["local"],
  success: { min_copies: 1 },
  compression: { method: "gzip", level: 6 },
  encryption: { method: "none" },
  signing: { method: "none" },
  retention: {
    keep_last: 3,
    keep_daily: 7,
    keep_weekly: 4,
    keep_monthly: 6,
    min_keep: 1,
  },
});
export const initialPlan = (): Plan => ({
  mode: "durable",
  configPath: "/etc/backfort/config.yaml",
  quickState: "/var/lib/backfort-quick",
  job: "app",
  restorePath: "/srv/recovery/app-drill",
  schedule: {
    kind: "none",
    time: "02:15",
    timezone: "UTC",
    account: "root",
    persistent: true,
    delay: 300,
    prune: false,
  },
  config: {
    version: 1,
    settings: {
      host_id: "web-01",
      state_directory: "/var/lib/backfort",
      temp_directory: "/var/tmp/backfort",
      lock_file: "/run/backfort.lock",
      min_free_mb: 512,
    },
    destinations: [
      { name: "local", type: "local", path: "/var/backups/backfort" },
    ],
    jobs: [newJob()],
  },
});
export type Preset = "local" | "offsite" | "encrypted" | "compose" | "upgrade";
export function applyPreset(previous: Plan, preset: Preset): Plan {
  const p = initialPlan();
  p.config.settings.host_id = previous.config.settings.host_id;
  p.config.jobs[0].source = {
    ...filesSource(),
    paths: ["/srv/app/uploads"],
    exclude: ["*.log", "*/cache/*"],
  };
  if (preset === "offsite" || preset === "encrypted") {
    p.config.destinations.push({
      name: "offsite",
      type: "rclone",
      remote: "company-s3",
      path: `backups-bucket/backfort/${p.config.settings.host_id}`,
    });
    p.config.jobs[0].destinations.push("offsite");
    p.config.jobs[0].success.min_copies = 2;
  }
  if (preset === "encrypted")
    p.config.jobs[0].encryption = {
      method: "age",
      recipient_env: "BACKFORT_AGE_RECIPIENT",
      identity_file_env: "BACKFORT_AGE_IDENTITY_FILE",
    };
  if (preset === "compose")
    p.config.jobs[0].source = {
      ...composeSource(),
      databases: [newDatabase()],
    };
  if (preset === "upgrade") p.mode = "quick";
  return p;
}
export function removeDestination(p: Plan, index: number): Plan {
  const c = structuredClone(p);
  const [removed] = c.config.destinations.splice(index, 1);
  c.config.jobs.forEach((j) => {
    j.destinations = j.destinations.filter((d) => d !== removed.name);
  });
  return c;
}
