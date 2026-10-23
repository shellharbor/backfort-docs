import type { Plan, Job } from "./schema";
import { assertValid } from "./validate";
import { shellQuote, renderArgv } from "./shellQuote";
export const executable = "/opt/backfort/backfort.sh";
export function recoveryConfig(p: Plan) {
  return p.mode === "durable"
    ? p.configPath
    : `${p.quickState}/${p.mode}/${p.config.jobs[0].name}.yaml`;
}
export function commandArgv(
  p: Plan,
  command: string,
  dry = false,
  job?: Job,
): string[] {
  assertValid(p);
  if (
    ![
      "run",
      "doctor",
      "list",
      "status",
      "watchdog",
      "verify",
      "restore",
      "restore-compose",
      "prune",
      "quick",
      "quick-compose",
    ].includes(command)
  )
    throw new Error("Command is outside the generated workflow.");
  if (dry && !["run", "prune", "quick", "quick-compose"].includes(command))
    throw new Error("Dry-run is not generated for this command.");
  const j =
    job || p.config.jobs.find((v) => v.name === p.job) || p.config.jobs[0];
  const a = ["sudo", executable];
  if (command === "quick" || command === "quick-compose") {
    if (dry) a.push("--dry-run");
    a.push(command);
    if (j.source.type === "files") a.push(...j.source.paths);
    else a.push(j.source.project_dir);
    a.push("--name", j.name);
    j.destinations.forEach((name) => {
      const d = p.config.destinations.find((v) => v.name === name)!;
      a.push(
        "--to",
        d.type === "local" ? d.path : `rclone:${d.remote}:${d.path}`,
      );
    });
    a.push(
      "--min-copies",
      String(j.success.min_copies),
      "--state-directory",
      p.quickState,
    );
    if (j.source.type === "files") {
      j.source.exclude.forEach((v) => a.push("--exclude", v));
      if (j.source.follow_symlinks) a.push("--follow-symlinks");
    } else {
      const s = j.source;
      s.files.forEach((v) => a.push("--file", v));
      s.volumes.forEach((v) => a.push("--volume", v));
      if (s.volumes.length)
        a.push("--volume-helper-image", s.volume_helper_image!);
      s.bind_mounts.forEach((b) => a.push("--bind", `${b.name}:${b.path}`));
      s.databases.forEach((d) =>
        a.push(
          "--db",
          [
            d.name,
            d.service,
            d.engine,
            d.user,
            d.password_env,
            d.databases?.join(","),
          ].join(":"),
        ),
      );
    }
  } else {
    a.push("-c", recoveryConfig(p));
    if (dry) a.push("--dry-run");
    a.push(command);
    if (
      ["run", "doctor", "list", "status", "prune", "watchdog"].includes(command)
    ) {
      if (p.job || p.mode !== "durable") a.push("--job", j.name);
    }
    if (["verify", "restore", "restore-compose"].includes(command))
      a.push("latest", "--job", j.name);
    if (command === "verify") a.push("--full");
    if (command === "restore" || command === "restore-compose")
      a.push("--to", p.restorePath);
  }
  return a;
}
export function generateCommands(p: Plan) {
  assertValid(p);
  const j = p.config.jobs.find((j) => j.name === p.job) || p.config.jobs[0];
  const make = (cmd: string, dry = false) =>
    renderArgv(commandArgv(p, cmd, dry, j));
  return {
    diagnostics:
      p.mode === "durable"
        ? make("doctor") + "\n" + make("run", true)
        : make(p.mode, true),
    run: make(p.mode === "durable" ? "run" : p.mode),
    inspect: make("list") + "\n" + make("status"),
    verify: make("verify"),
    restore: make(j.source.type === "files" ? "restore" : "restore-compose"),
    prune: make("prune", true),
    recoveryConfig: recoveryConfig(p),
  };
}
export function configInstall(p: Plan) {
  assertValid(p);
  const parent = p.configPath.slice(0, p.configPath.lastIndexOf("/")) || "/";
  return `sudo sh -c 'set -eu; if [ ! -d "$1" ]; then install -d -o root -g root -m 0750 -- "$1"; fi' sh ${shellQuote(parent)}\nsudo sh -c 'set -euC; umask 027; cat > "$1"; chown root:root -- "$1"; chmod 0640 -- "$1"' sh ${shellQuote(p.configPath)} < './backfort.yaml'`;
}
