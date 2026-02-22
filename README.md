# Water Intelligence Platform

> *Every query has a cost. Every model has a thirst.*

Fresh water covers less than 3% of Earth's surface — and less than 1% of that is accessible
to humans. Yet as AI infrastructure has scaled into one of the fastest-growing industries on
the planet, it has quietly become one of its most water-intensive. Training a single large
language model can consume hundreds of thousands of liters of water for cooling. A data center
running inference at scale draws as much water daily as a small city. And unlike energy — which
can be generated from renewables — water consumed for cooling is largely lost to evaporation,
removed from local watersheds permanently.

Meanwhile, freshwater systems are under unprecedented pressure. Droughts are intensifying.
Aquifers are being drawn down faster than they recharge. Rivers that once ran year-round now
run dry in summer. The communities and ecosystems that depend on these systems don't get a
quarterly report from the hyperscalers drawing from the same water table.

This platform exists to make that connection visible.

By combining real hydrological measurements from U.S. Geological Survey stream gauges with
transparent, deterministic modeling, the Water Intelligence Platform translates raw water data
into terms that make the AI industry's water footprint tangible: not as abstract statistics,
but as a live, station-by-station accounting of what our digital infrastructure costs the
natural world. No black boxes. No obfuscation. Just data, math, and honesty.

**Water is not an infinite resource. Neither is our right to use it without accountability.**

---

A public-facing environmental transparency platform that makes real U.S. water data
accessible and translates hydrological measurements into AI sustainability equivalents.

**Live data from the U.S. Geological Survey. No mocked data. No paid AI APIs. Fully explainable.**

---

## Architecture

```
water-intelligence-platform/
├── backend/     NestJS API (TypeScript)
└── frontend/    React + MUI + Recharts (TypeScript)
```

### Backend modules
| Module | Responsibility |
|--------|----------------|
| `WaterModule` | Fetch & normalize USGS OGC API data |
| `AiImpactModule` | Deterministic sustainability modeling |
| `IntelligenceModule` | Moving averages, anomaly detection, scoring |
| `AnalyticsModule` | In-memory observability (request tracking) |

### Primary endpoint
```
GET /intelligence?stationId=01646500
```

### Other endpoints
```
GET /stations?state=VA
GET /analytics/summary
GET /analytics/public
GET /health
```

---

## Local Development

### Prerequisites
- Node.js 20+
- npm 9+

### Backend

```bash
cd backend
cp .env.example .env
npm install
npm run start:dev
# API available at http://localhost:3001
```

### Frontend

```bash
cd frontend
cp .env.example .env
# Edit REACT_APP_API_BASE_URL=http://localhost:3001
npm install
npm start
# UI available at http://localhost:3000
```

---

## Production Deployment

### Backend → Render

1. Push repository to GitHub.
2. Create a new **Web Service** on [render.com](https://render.com).
3. Point it to the `backend/` directory.
4. Set **Build Command**: `npm install && npm run build`
5. Set **Start Command**: `npm run start:prod`
6. Add environment variables from `.env.example`.

### Frontend → GitHub Pages

1. In `frontend/package.json`, set `"homepage"` to your GitHub Pages URL:
   ```json
   "homepage": "https://yourusername.github.io/water-intelligence-platform"
   ```
2. Update `REACT_APP_API_BASE_URL` to your Render backend URL.
3. Deploy:
   ```bash
   cd frontend
   npm run deploy
   ```

---

## Docker

### Backend only
```bash
cd backend
docker build -t water-intelligence-api .
docker run -p 3001:3001 --env-file .env water-intelligence-api
```

### Full stack (docker-compose)
```bash
# From repo root
docker-compose up
```

---

## Environment Variables

### Backend (`backend/.env`)
| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3001` | API port |
| `CORS_ORIGIN` | `http://localhost:3000` | Frontend origin |
| `USGS_BASE_URL` | `https://api.waterdata.usgs.gov/ogcapi/v0` | USGS API base |
| `CACHE_TTL_SECONDS` | `300` | In-memory cache TTL |
| `WATER_PER_KWH` | `1.8` | Liters of water per kWh (data center cooling) |
| `KWH_PER_AI_INFERENCE` | `0.001` | kWh per AI inference |
| `KWH_PER_GPU_TRAINING_HOUR` | `1.2` | kWh per GPU training hour |

### Frontend (`frontend/.env`)
| Variable | Default | Description |
|----------|---------|-------------|
| `REACT_APP_API_BASE_URL` | `http://localhost:3001` | Backend API URL |

---

## USGS Station IDs — Quick Reference

| Station | ID | Location |
|---------|----|----------|
| Potomac at Point of Rocks | `01638500` | MD/VA |
| Mississippi at St. Louis | `07010000` | MO |
| Colorado at Lees Ferry | `09380000` | AZ |
| Columbia at The Dalles | `14105700` | OR |
| Rio Grande at El Paso | `08364000` | TX |

---

## Intelligence Engine — Algorithm Reference

### Moving Averages
Simple arithmetic mean over N most recent daily values.
If fewer than N values exist, all available values are used.

### Volatility Index
`volatility = stdDev / mean` (coefficient of variation)
Capped at 2.0 for display. Values > 0.5 indicate high volatility.

### Anomaly Detection (rule-based)
```
if (today / MA7) >= 2.0  → severity: "severe"
if (today / MA7) >= 1.5  → severity: "moderate"
else                      → severity: "none"
```

### Sustainability Score (0–100)
Starts at 100; deductions applied:
- Volatility > 0.5: −20
- Severe anomaly: −30
- Moderate anomaly: −15
- Flow < 10th percentile of recent series: −15

---

## Future Roadmap
- [ ] PostgreSQL persistence layer for analytics
- [ ] Time-series caching with Redis
- [ ] User authentication for personalized station watchlists
- [ ] WebSocket real-time updates
- [ ] Export to CSV / GeoJSON
- [ ] Mobile-first PWA

---

## Data Attribution

Water data provided by the **U.S. Geological Survey** Water Data for the Nation.
- API: https://api.waterdata.usgs.gov/ogcapi/v0
- Website: https://waterdata.usgs.gov

This platform is not affiliated with or endorsed by USGS.

## License
MIT
