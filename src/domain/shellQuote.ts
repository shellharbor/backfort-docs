// Reject control bytes in literal command arguments and paths.
// eslint-disable-next-line no-control-regex
export const control = /[\u0000-\u001f\u007f]/;
export function shellQuote(value: string): string {
  if (control.test(value))
    throw new Error(
      "Control characters are not allowed in a command argument.",
    );
  return "'" + value.replaceAll("'", "'\"'\"'") + "'";
}
export const renderArgv = (argv: string[]) => argv.map(shellQuote).join(" ");
export function heredoc(body: string): string {
  let delimiter = "BACKFORT_CONFIG";
  while (body.split("\n").includes(delimiter)) delimiter += "_END";
  return `cat <<'${delimiter}'\n${body.replace(/\n?$/, "\n")}${delimiter}`;
}
