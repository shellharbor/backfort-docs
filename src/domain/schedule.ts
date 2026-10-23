import type { Plan } from "./schema";
import { assertValid } from "./validate";
import { executable } from "./generateCommands";
import { requiredEnv } from "./compatibility";
import { shellQuote } from "./shellQuote";
export function generateSchedule(p: Plan): Record<string, string> {
  assertValid(p);
  if (p.mode !== "durable" || p.schedule.kind === "none") return {};
  const s = p.schedule;
  const env = requiredEnv(p).length > 0;
  const args = `${executable} -c "${p.configPath}" run${p.job ? ` --job "${p.job}"` : ""}`;
  const service = `[Unit]\nDescription=Backfort backup\n[Service]\nType=oneshot\nUser=${s.account}\nUMask=0077\n${env ? "EnvironmentFile=/etc/backfort/backfort.env\n" : ""}ExecStart=${args}\n`;
  const timer = `[Unit]\nDescription=Backfort backup schedule\n[Timer]\nOnCalendar=*-*-* ${s.time}:00 ${s.timezone}\nPersistent=${s.persistent}\nRandomizedDelaySec=${s.delay}\n[Install]\nWantedBy=timers.target\n`;
  if (s.kind === "systemd") {
    const files: Record<string, string> = {
      "backfort.service": service,
      "backfort.timer": timer,
    };
    if (s.prune) {
      const [h, m] = s.time.split(":").map(Number);
      const pruneTime = `${String((h + 6) % 24).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
      files["backfort-prune.service"] = service
        .replace(
          "Description=Backfort backup",
          "Description=Backfort retention (review preview first)",
        )
        .replace('" run', '" prune');
      files["backfort-prune.timer"] = timer
        .replace("backup schedule", "retention schedule")
        .replace(s.time, pruneTime);
    }
    return files;
  }
  const [hour, minute] = s.time.split(":");
  const invocation = env
    ? `/usr/bin/systemd-run --quiet --wait --collect --property=User=${s.account} --property=EnvironmentFile=/etc/backfort/backfort.env -- ${args}`
    : args;
  return {
    "backfort.cron": `# /etc/cron.d/backfort (user column included); install root-owned, mode 0644.\n# Confirm CRON_TZ support and server timezone: ${s.timezone}\n# With environment variables: requires systemd-run and a protected root-owned env file.\nPATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin\nCRON_TZ=${s.timezone}\n${Number(minute)} ${Number(hour)} * * * ${env ? "root" : s.account} ${invocation} >> /var/log/backfort.log 2>&1\n`,
  };
}
export function scheduleInstallCommands(p: Plan): string {
  const files = Object.keys(generateSchedule(p));
  if (!files.length) return "";
  const target =
    p.schedule.kind === "systemd" ? "/etc/systemd/system/" : "/etc/cron.d/";
  return files
    .map(
      (file) =>
        `sudo sh -c 'set -euC; umask 022; cat > "$1"; chown root:root -- "$1"; chmod 0644 -- "$1"' sh ${shellQuote(target + (p.schedule.kind === "systemd" ? file : "backfort"))} < ${shellQuote("./" + file)}`,
    )
    .join("\n");
}
