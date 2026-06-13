# Financial Sector PQC Readiness Monitor

A dashboard tracking post-quantum cryptography (PQC) readiness across the top 100
U.S. financial institutions and the top 100 third-party providers to the sector,
alongside a live intelligence feed of standards, policy, guidance, and sector news.

It is a **zero-dependency static web app** — plain HTML, CSS, and JavaScript with
no build step and no framework runtime. Open it in any modern browser.

## Running it

**Option A — double-click launcher (Windows):**
Double-click `Start PQC Monitor.cmd`. It starts a local static server and opens
the dashboard at <http://localhost:8421/>.

**Option B — open directly:**
Open `index.html` in your browser. (Serving via Option A is preferred — browsers
apply stricter rules to `file://` pages, and a couple of the live feeds need a
served origin.)

**Option C — any static server**, e.g. from this folder:

```sh
# PowerShell (no Node/Python required)
powershell -NoProfile -ExecutionPolicy Bypass -File .claude/serve.ps1
# then visit http://localhost:8421/
```

## What's inside

| View | Description |
| --- | --- |
| **Overview** | KPIs, readiness distribution, size-tier breakdown, migration-deadline timeline, leaders / watch list. |
| **Institutions** | Top 100 U.S. banks by assets — filter by status/category, search, click any row for a detail drawer. |
| **Third Parties** | Top 100 sector providers (core processors, cloud, payments, PKI/HSM, …) by revenue. |
| **Intelligence** | Standards & Policy, Implementation Guidance, Sector News, Third-Party News — each a curated snapshot **plus a live feed** refreshed on every load. |
| **Methodology** | How readiness scores, evidence levels, and the feeds work. |

## Intelligence feeds

Each intelligence section combines a curated June 2026 snapshot with a live
running list refreshed on every page load from trusted, browser-accessible
sources, and persisted locally across sessions:

- **Federal Register API** — official U.S. policy and regulator documents
- **IETF Datatracker API** — post-quantum standards and guidance documents
- **Crossref API** — peer-reviewed PQC research
- **Hacker News (Algolia) API** — discovery layer, restricted to a strict
  allowlist of vendor newsrooms, sector institutions, and reputable tech press

Every feed is searchable, sortable, and links to the original source. Feeds
degrade gracefully offline (curated snapshot + stored list still render).

## Project layout

```
index.html            entry point
css/
  foundations.css     design-system tokens (colors, type, spacing)
  app.css             component styles
js/
  data/               institutions, vendors, news datasets
  icons.js            inline icon set (no CDN)
  ui.js               shared chips / cards / formatters
  overview.js         overview view
  registers.js        institutions + third-parties tables
  feeds.js            live intelligence feed engine
  intel.js            intelligence + methodology views
  drawer.js           detail slide-over
  main.js             shell, router, event wiring
.claude/
  launch.json         preview-server config
  serve.ps1           PowerShell static file server
```

## Data caveats

Readiness assessments are a curated snapshot (Q1 2026 figures, rounded). Rows
marked **Estimated** are representative placeholders pending a live TLS scan; the
data files are structured so a real scan export can drop straight in. See the
in-app **Methodology** view for what the scores do and don't measure.
