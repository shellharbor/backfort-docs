# Backfort design system

## Direction

A calm, practical operator's notebook with a dark terminal illustration and a visible local configuration plan. Familiar Linux terms are retained where they name actual interfaces. UI explanations are available in English and Russian; code, paths, YAML and flags do not change with language.

## Tokens

| Role | Value / treatment |
| --- | --- |
| Canvas | #fcfcf8 |
| Primary ink | #192d29 |
| Action / brand | #174d3e |
| Terminal | #192f29 |
| Accent | #daf6a6; no low-contrast lime body text |
| Soft surfaces / border | #f2f5ec / #dce3d7 |
| Muted text | #5e7068 and #586e50; pale text corrected after axe checks |
| Errors | #9c3b27 on a pale warm background |
| Typography | Local Inter if installed, Segoe UI, Arial; local monospace for code; Cyrillic supported |
| Scale | Large stacked hero; 29–35 px section titles; 24–25 px form titles; labels remain secondary to editable values |
| Layout | Max 1280 px; generous outer margins; desktop step navigation / form / preview; single column below 780 px |
| Shape | Thin green-grey borders, 5–10 px radii, restrained terminal shadow |
| Motion | Short progress transitions; disabled under prefers-reduced-motion |

## Components

- `Field` owns labels, help/error IDs and invalid state. Linux paths preserve spaces and apostrophes. Multiline fields retain a trailing newline while the user adds another entry.
- `Toggle` has an explicit accessible name and descriptive hint. Browser-native controls provide keyboard behavior.
- `CodeBlock` renders plain escaped text, independently scrolls with keyboard focus, handles clipboard success/failure and optional download. It never renders user input through innerHTML.
- Wizard navigation preserves form data. Basic/Advanced changes visibility; advanced values remain in the summary and full YAML. Invalid plans remove current executable output entirely.
- Source and protection variants replace incompatible structured objects. Presets are labeled examples and preserve host identity.
- Header links use hashes; initial direct-entry hashes are handled after React mounts. No history-router fallback is needed.

Icons and the fortress mark are original inline SVG. No generated imagery, third-party icon package, analytics, remote fonts or runtime network service is used.
