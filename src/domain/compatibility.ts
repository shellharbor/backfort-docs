import type { Plan, Job } from "./schema";
export function activeJobs(p: Plan): Job[] {
  return p.mode === "durable" ? p.config.jobs : p.config.jobs.slice(0, 1);
}
export function requiredEnv(p: Plan): string[] {
  const env: string[] = [];
  activeJobs(p).forEach((j) => {
    if (j.source.type === "docker_compose")
      j.source.databases.forEach((d) => env.push(d.password_env));
    if (p.mode === "durable") {
      Object.entries(j.encryption).forEach(([k, v]) => {
        if (k.endsWith("_env") && typeof v === "string") env.push(v);
        if (k === "recipients_env" && Array.isArray(v)) env.push(...v);
      });
      if (j.signing.method === "minisign")
        env.push(
          j.signing.secret_key_env || "",
          j.signing.public_key_env || "",
        );
    }
  });
  if (p.mode === "durable" && p.config.notifications?.enabled)
    p.config.notifications.channels.forEach((c) =>
      Object.entries(c).forEach(([k, v]) => {
        if (k.endsWith("_env") && typeof v === "string") env.push(v);
      }),
    );
  if (p.config.destinations.some((d) => d.type === "rclone"))
    env.push("RCLONE_CONFIG");
  return [...new Set(env.filter(Boolean))];
}
export function prerequisites(p: Plan): string[] {
  const needs = [
    "Linux",
    "Bash 4.3+",
    "Mike Farah yq v4",
    "GNU tar",
    "coreutils",
    "findutils",
    "flock (util-linux)",
    "SHA-256 tools",
  ];
  activeJobs(p).forEach((j) => {
    needs.push(p.mode === "durable" ? j.compression.method : "gzip");
    if (j.source.type === "docker_compose") {
      needs.push(
        "Docker Engine",
        "Compose v2",
        "timeout + dump tools in DB images",
      );
      if (j.source.volumes.length)
        needs.push("Preloaded helper image with tar + timeout");
    }
    if (p.mode === "durable") {
      needs.push(j.encryption.method);
      if (j.signing.method === "minisign") needs.push("minisign");
    }
  });
  if (p.config.destinations.some((d) => d.type === "rclone"))
    needs.push("rclone (configured for execution account)");
  return [...new Set(needs.filter((n) => n !== "none"))];
}
