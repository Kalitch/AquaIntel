# AquaIntel v0.1.0 — Platform Memory Release

> *Every query has a cost. Every model has a thirst. Now the platform remembers.*

**Release date:** February 26, 2026  
**Repository:** [github.com/Kalitch/AquaIntel](https://github.com/Kalitch/AquaIntel)

---

## Overview

v0.1.0 is the first major milestone release of AquaIntel. Where v0.0.x established live
USGS data integration and the deterministic intelligence engine, v0.1.0 gives the platform
its own memory. Every intelligence query is now persisted to PostgreSQL — building an
independent record of water conditions, anomaly events, and sustainability scores that
exists entirely outside the USGS data source.

This release also introduces the first full AI narrative pipeline: structured hydrological
data flows from USGS → intelligence engine → Mistral LLM → plain-English narrative,
with context trimming to fit local model constraints. Station status handling ensures
decommissioned stations surface their historical record rather than returning empty.

---

## What's New

### PostgreSQL Persistence Layer

AquaIntel now has a database. Three TypeORM entities back the history system:

- **`station_snapshots`** — every `/intelligence` query result persisted asynchronously.
  Stores flow value, sustainability score, anomaly severity, drought severity, percentile,
  moving averages, and volatility index with a timestamp.
- **`anomaly_events`** — dedicated table for moderate and severe anomaly detections,
  enabling fast timeline queries without scanning the full snapshot history.
- **`station_cache`** — tracks total query count and last-seen timestamp per station.
  Built with a raw SQL `ON CONFLICT DO UPDATE` upsert for atomic increment.

Snapshots are written with `void historyService.writeSnapshot()` — fire-and-forget,
never awaited. Zero latency impact on the intelligence response.

**New endpoints:**
```
GET /history/:stationId          — Full snapshot history, anomaly timeline, score trend
GET /history/:stationId?days=30  — Configurable lookback window
GET /history/platform/summary    — Platform-wide stats: total snapshots, anomaly count,
                                   most-queried stations, recent anomaly events
```

**Self-hosted via Docker Compose:**
```yaml
postgres:
  image: postgres:16-alpine
  environment:
    POSTGRES_DB: aquaintel
    POSTGRES_USER: aquaintel
    POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-aquaintel_dev}
```

TypeORM SSL is disabled automatically for local and Docker connections
(`localhost`, `postgres:5432`, `127.0.0.1`). Cloud deployments (Render, Railway)
use `ssl: { rejectUnauthorized: false }` automatically.

---

### Platform History Tab

New frontend page at `/history` showing two sections:

**Platform Overview** — live stats from `/history/platform/summary`:
- Total snapshots recorded
- Total anomaly events detected
- Stations tracked
- Snapshots in last 24h and 7d
- Most-queried stations leaderboard
- Recent anomaly feed across all stations

**Station History** — per-station record for the currently selected station:
- Sustainability score trend chart (Recharts AreaChart with min/avg/max bands)
- Day range selector: 30d / 60d / 90d
- Anomaly event timeline with severity chips, drought context, and score at detection time
- Empty state guiding users to query a station to start building its record

---

### Station Status Handling

Stations that have been decommissioned or are inactive no longer return empty data.
The platform now:

1. Strictly matches only `computation_identifier: "Mean"` + `computation_period_identifier: "Daily"`
   discharge series — no fallback to instantaneous or water-year series
2. Checks the series `end` date — if older than 7 days, the station is marked inactive
3. Fetches **365 days** of data for inactive stations (vs 90 for active) to reach
   historical readings that may be years in the past
4. Returns a `stationStatus` object with `active`, `lastRecordDate`, and a plain-English
   `message` field

**New `StationStatusBanner` component** surfaces this on Dashboard and Intelligence pages:

> ⚠️ **Inactive Station** — This station was decommissioned or is inactive.
> Last record: June 30, 2020. Historical data is shown below.

Active stations see no UI change.

---

### Full-Context LLM Narratives

The Mistral narrative pipeline now receives the same full dataset displayed on the
Intelligence page — percentiles, drought context, station status — without exceeding
local model context limits.

**Architecture:**
- Frontend POSTs the full `IntelligenceResponse` to `POST /intelligence/narrative`
- Controller extracts a typed `enrichment` slice — 8 scalar fields only
- `dailySeries` (90 rows, ~3000 tokens) is explicitly stripped before prompt construction
- Prompt size reduced from ~7276 tokens to ~700 tokens

**`enrichment` fields passed to Mistral:**
```
percentileInterpretation, currentPercentile, recordYears,
stationActive, stationStatusMessage, p10, p50, p90
```

**Prompt structure** (3 paragraphs, strict rules):
- Paragraph 1: Current conditions in plain English
- Paragraph 2: Historical percentile context connected to AI/datacenter water footprint
- Paragraph 3: Trend from moving averages and volatility with outlook
- Closes with `Takeaway:` — one actionable sentence

The `GET /intelligence/narrative` endpoint remains for backwards compatibility.

---

### Frontend Caching with Zustand

Tab switching no longer triggers backend refetches. A Zustand store (`intelligenceStore.ts`)
caches intelligence and station data client-side:

- Intelligence data: 5-minute TTL per station ID
- Station lists: 15-minute TTL per state
- `isStale()` check runs before every fetch — returns cached data if fresh

Result: switching between Dashboard → Intelligence → Historical → back to Dashboard
makes zero additional backend requests while data is within the TTL window.
The four simultaneous requests previously visible in logs on every navigation are eliminated.

---

### USGS API Fixes

- **Correct collection:** `/collections/daily/items` (was incorrectly `/collections/time-series/items`)
- **Two-step time series ID discovery:** `time-series-metadata` → `daily/items` with `time_series_id` filter
- **Single-request pattern:** Latest reading derived from the tail of the daily series,
  eliminating the parallel fetch that caused 429 rate limit errors
- **`time` parameter** for date range filtering (was `datetime`)
- **`sortby: 'time'`** syntax (was `'time:A'` which is invalid)

---

## Breaking Changes

- `WaterData` now includes a required `stationStatus: StationStatus` field.
  Any code reading `WaterData` without this field will need updating.
- `StationNarrativeInput.intelligence?: any` has been removed and replaced with
  `enrichment?: { ... }` — a typed, trimmed shape. Direct `intelligence` field
  references in LLM controller code must be migrated.
- `fetchDailySeries` now accepts a `days` parameter (default: 90). Existing callers
  with no argument are unaffected.

---

## Bug Fixes

- **TypeORM upsert error** — `orUpdate` with function parameters unsupported in this
  TypeORM version. Replaced with raw `INSERT ... ON CONFLICT DO UPDATE` SQL.
- **SSL connection error on Docker** — TypeORM SSL detection now checks for
  `postgres:5432` (Docker service hostname) in addition to `localhost`.
- **RSS feed 403/404 errors** — EPA Newsroom (blocks server-side scrapers) and
  E&E News (URL changed) disabled. Drought Monitor feed URL corrected.
  Circle of Blue and Inside Climate News added as replacements.
- **Token overflow on narrative generation** — 7276-token prompt reduced to ~700
  by stripping `dailySeries` from the LLM input.
- **`findDailyMeanTimeSeriesId` bad fallback** — previously grabbed the first
  available series regardless of type, returning instantaneous data for stations
  that have a daily mean series. Now strictly typed with no fallback.

---

## Dependencies Added

**Backend:**
```
@nestjs/typeorm
typeorm
pg
```

**Frontend:**
```
zustand
```

---

## Configuration

New environment variables in `backend/.env`:

```env
# PostgreSQL (required for history persistence)
DATABASE_URL=postgresql://aquaintel:aquaintel_dev@localhost:5432/aquaintel

# Set true in development — auto-creates tables via TypeORM synchronize
# Set false in production — run migrations manually
POSTGRES_SYNC=true
```

---

## Architecture After v0.1.0

```
AquaIntel/
├── backend/src/
│   ├── water/          USGS OGC API integration + drought + percentiles
│   ├── intelligence/   Moving averages, anomaly detection, scoring
│   ├── ai-impact/      Deterministic water/energy equivalents
│   ├── llm/            Mistral/OpenAI/Anthropic narrative generation
│   ├── history/        PostgreSQL persistence (NEW)
│   │   ├── entities/   station_snapshots, anomaly_events, station_cache
│   │   ├── history.service.ts
│   │   └── history.controller.ts
│   ├── legislation/    Curated water/AI bill tracker
│   └── news/           RSS feed aggregation
│
└── frontend/src/
    ├── components/store/intelligenceStore.ts   Zustand cache (NEW)
    ├── components/shared/StationStatusBanner   Inactive station warning (NEW)
    ├── components/history/                     History page components (NEW)
    │   ├── ScoreTrendChart.tsx
    │   ├── AnomalyTimeline.tsx
    │   ├── PlatformStatsPanel.tsx
    │   └── StationHistoryPanel.tsx
    └── pages/PlatformHistoryPage.tsx           History tab (NEW)
```

---

## Roadmap

- **v0.1.1** — Station watchlist with server-side anomaly alerts (webhook/email)
- **v0.2.0** — UK Environment Agency API integration (water quality: dissolved oxygen,
  temperature, conductivity — direct indicators of thermal pollution from datacenter cooling)
- **v0.3.0** — Watershed stress map (Leaflet, stations colored by sustainability score,
  drought overlay, datacenter proximity markers)
- **Long term** — Corporate water disclosure scorecard, FOIA request tracker,
  AI water cost calculator ("How much water did your ChatGPT usage cost?")

---

## Data Attribution

Water data: **U.S. Geological Survey** Water Data for the Nation  
Drought data: **U.S. Drought Monitor** (University of Nebraska-Lincoln)  
Historical percentiles: **USGS National Water Information System Statistics Service**

This platform is not affiliated with or endorsed by USGS, the Drought Monitor, or any
federal agency.

---

*Water is not an infinite resource. Neither is our right to use it without accountability.*