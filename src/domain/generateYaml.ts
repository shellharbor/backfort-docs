import { stringify } from "yaml";
import type { Plan } from "./schema";
import { assertValid } from "./validate";
export function generateYaml(p: Plan): string {
  assertValid(p);
  if (p.mode !== "durable")
    throw new Error(
      "Quick recovery configuration is written by Backfort on the server.",
    );
  return (
    "# Backfort 1.3.0 · YAML schema 1\n# Example paths: review on your server before running.\n" +
    stringify(p.config, {
      lineWidth: 0,
      defaultStringType: "QUOTE_DOUBLE",
      defaultKeyType: "PLAIN",
      doubleQuotedAsJSON: true,
    })
  );
}
