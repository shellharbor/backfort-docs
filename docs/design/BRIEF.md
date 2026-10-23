# Backfort website brief

Audience: Linux server operators who want explicit backups and a practical recovery path. The primary action is to prepare a valid YAML plan and diagnostics before deliberately running commands on their server.

The scope is a standalone static EN/RU site: overview, installation, five-step configuration, recovery, full CLI reference and FAQ. English is the default. No backend, authentication, live server status, secret inputs or browser persistence. React/TypeScript/Vite is confirmed by package.json.

The supplied Backfort brief governs behavior. Files/Compose, durable/quick/quick-compose, multiple jobs/destinations and Advanced controls all belong to the implementation. Python/container/Helm are documented distributions rather than interactive runners.

## Reference observations

LaraShip Docs, commit 1744157154e84a1829591deb918c8b1fd625ba48: the published desktop page was observed in the browser. It uses an off-white canvas, a deep green terminal, restrained lime accents, large stacked headings, ample whitespace and a three-column wizard. Source components, styles, domain helpers and workflow were inspected. Its deployment fields/runner model were not reused.

The Backfort direction keeps that visual relationship with an original fortress mark, a backup/recovery narrative and a YAML preview. Terminal rows describe capabilities, not invented live results. All fonts are local/system; no remote imagery or font service is required.

Mobile reference behavior was reviewed in the reference CSS; the Backfort implementation itself was rendered and tested at 360, 390, 820 and 1280 pixels in EN/RU. Reference mobile rendering is not claimed.

See [system](SYSTEM.md), [acceptance](ACCEPTANCE.md), and [compatibility audit](../upstream-compatibility.md).
