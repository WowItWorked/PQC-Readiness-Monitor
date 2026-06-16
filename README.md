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
| **Readiness Trends** | Charts built from the daily snapshot history: cohort average over time, status-mix transitions, biggest movers, and a per-entity score tracker. |
| **Locations & Hazards** | Interactive map of PNC's U.S. footprint (HQ, regional/market HQs, operations centers, subsidiaries) overlaid with **live** natural-hazard alerts (hurricanes, tornadoes, wildfire/Red Flag, floods, winter storms, extreme heat, high wind) and a modeled regional power-grid stress index. Auto-refreshes in real time; click any site for stats and a live forecast. |
| **Intelligence** | Standards & Policy, Implementation Guidance, Sector News, Third-Party News — each a curated snapshot **plus a live feed** refreshed on every load. |
| **Methodology** | How readiness scores, evidence levels, and the feeds work. |

Each detail drawer also includes a **Rating basis — technical analysis** section
that decomposes the score into its four signal dimensions with a strength level
and a technical rationale, so the confidence behind every rating is transparent.

## Snapshot history & trends

The daily Action records one snapshot of every entity's readiness score into
`js/data/history.js`. The **Readiness Trends** page reads that history and renders
(inline SVG, no chart library) how ratings transition over time — per cohort and
per entity. Scores are flat while the underlying curated data is unchanged; the
charts surface movement automatically once a rating changes.

## Locations & Hazards map

The **Locations & Hazards** view plots PNC Financial Services Group's physical
footprint on a zero-dependency, Albers equal-area map (the base geography is an
embedded low-resolution continental-US GeoJSON; every state polygon and every
PNC marker are drawn through the same projection, so they align exactly).

- **Footprint** — the corporate headquarters (The Tower at PNC Plaza, Pittsburgh),
  regional/market headquarters, the Firstside operations center, the BBVA USA
  legacy footprint (Texas, Alabama, Arizona, Colorado, California, …), and
  subsidiary head offices (Harris Williams — Richmond; Midland Loan Services —
  Overland Park; PNC Capital Markets; Solebury Capital). The ~2,300-branch retail
  network across 28 states + DC is summarized at the state level.
- **Live hazards** — active watches & warnings from the U.S. **National Weather
  Service** API (`api.weather.gov`, no key, CORS-enabled), categorized into
  hurricane/tropical, tornado, fire (Red Flag), flood, severe storm, winter/ice,
  extreme heat, and high wind. States light up by the strongest active severity;
  filter by hazard layer; every alert links to its authoritative NWS source.
- **Live forecast** — clicking any site fetches its 7-period NWS point forecast.
- **Regional power-grid stress** — a **modeled** outage-risk index derived from
  the live hazards intersecting each state (severe weather is the dominant driver
  of U.S. grid outages). It is clearly labelled as modeled, **not** a live utility
  feed (no free keyless real-time outage API exists).
- **Real time** — the hazard feed auto-refreshes every 5 minutes (toggleable),
  with a manual Refresh and a live "Updated" timestamp; the feed degrades
  gracefully to the footprint-only map when offline.

## Intelligence feeds

Each intelligence section combines a curated June 2026 snapshot with a live
running list refreshed on every page load, and persisted locally across
sessions. Sourcing is scoped per section:

- **Standards & Policy** — official **U.S., U.K., and EU government only**.
  Live: Federal Register API (U.S.) and the GOV.UK Search API (U.K. — HM
  Treasury, DSIT, NCSC). EU policy (ENISA, European Commission) and the core
  NIST standards are included as verified curated links.
- **Implementation Guidance** — fulsome best practices and implementation
  guidance from **NIST/NCCoE, CISA/NSA, UK NCSC, ENISA, FS-ISAC, and FSSCC**.
  Each best-practice card and document links to its authoritative source; live
  additions come from NIST notices (Federal Register) and GOV.UK guidance.
- **Sector News** — U.S. financial regulators (Federal Register) plus an
  allowlist of sector institutions and financial press (BIS, Swift, DTCC,
  Reuters, FT, …) via the Hacker News API.
- **Third-Party News** — vendor newsroom posts and reputable technology press,
  restricted to a domain allowlist via the Hacker News API.

**Every item in every section links to its authoritative source.** Each feed is
searchable and sortable (newest / oldest / source). Feeds degrade gracefully
offline — the curated, fully-linked snapshot still renders.

## Daily auto-refresh

A scheduled GitHub Action ([`.github/workflows/daily-refresh.yml`](.github/workflows/daily-refresh.yml))
runs every day at **6:00 AM US Eastern** (10:00 UTC): it advances the "Data as
of" date, commits, and requests a fresh GitHub Pages build so the published site
never goes stale. (Visitors also get live data on every page load.) GitHub cron
is UTC and ignores daylight saving — edit the `cron:` line to change the time or
timezone.

## Project layout

```
index.html            entry point
css/
  foundations.css     design-system tokens (colors, type, spacing)
  app.css             component styles
js/
  data/               institutions, vendors, news datasets
    locations.js      PNC facilities + state footprint
    us-geo.js         embedded continental-US state boundaries (GeoJSON)
  icons.js            inline icon set (no CDN)
  ui.js               shared chips / cards / formatters
  overview.js         overview view
  registers.js        institutions + third-parties tables
  feeds.js            live intelligence feed engine
  intel.js            intelligence + methodology views
  locations.js        Locations & Hazards map (live NWS overlay + grid model)
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

On the **Locations & Hazards** map, the named corporate, regional, operations and
subsidiary facilities (and their coordinates) are real and publicly documented,
but per-site employee and metro-branch figures are **representative estimates** —
PNC does not publish them. The retail branch network is summarized at the state
level rather than to each street address. Weather hazards and point forecasts are
**live** from `api.weather.gov`; the power-grid stress index is **modeled** from
those hazards, not a live utility outage feed.
