# USGS OGC API v0 - Collection Paths Reference

## Critical Update: Correct Collection Names

The service has been refactored to use the **correct USGS OGC API collections**. Previous attempts to use `/collections/monitoring-locations/items`, `/collections/daily/items`, and `/collections/latest/items` were incorrect.

## Correct Collections

### 1. Time-Series Metadata Discovery
**Endpoint**: `/collections/time-series-metadata/items`

**Purpose**: Find available time series for a station and get its coordinates

**Example Request**:
```
GET https://api.waterdata.usgs.gov/ogcapi/v0/collections/time-series-metadata/items?monitoring_location_id=USGS-09418500&parameter_code=00060&limit=10&f=json
```

**Response Structure**:
```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "properties": {
        "id": "ed09a1ca445644afb246a0e18376ca96",
        "monitoring_location_id": "USGS-09418500",
        "parameter_code": "00060",
        "parameter_name": "Streamflow",
        "computation_identifier": "Mean",
        "computation_period_identifier": "Daily",
        "begin": "1951-02-01",
        "end": "2026-02-22",
        "time_zone": "UTC"
      },
      "geometry": {
        "type": "Point",
        "coordinates": [-108.5, 37.2]
      }
    }
  ]
}
```

**Key Property Filters**:
- `parameter_code: "00060"` — Discharge/Streamflow only
- `computation_identifier: "Mean"` — Daily mean (not instantaneous)
- `computation_period_identifier: "Daily"` — Daily aggregation
- `properties.id` — The **time series ID** needed for data fetches

### 2. Observation Data Fetch
**Endpoint**: `/collections/time-series/items`

**Purpose**: Fetch actual streamflow observations for a specific time series

**Example Request**:
```
GET https://api.waterdata.usgs.gov/ogcapi/v0/collections/time-series/items?time_series_id=ed09a1ca445644afb246a0e18376ca96&datetime=2025-11-24/2026-02-22&sortby=time:D&limit=1&f=json
```

**Response Structure**:
```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "properties": {
        "time": "2026-02-22T12:00:00Z",
        "value": 1847,
        "unit_of_measure": "ft³/s",
        "qualifiers": [null]
      }
    }
  ]
}
```

**Common Query Parameters**:
- `time_series_id` — **Required**: From metadata discovery
- `datetime` — Optional: Date range `YYYY-MM-DD/YYYY-MM-DD`
- `sortby` — Optional: `time:A` (ascending) or `time:D` (descending)
- `limit` — Optional: Number of records to return (default 100)

## Data Discovery Workflow (Implemented)

### Step 1: Find Station Coordinates
```
Query: /collections/time-series-metadata/items
Params: monitoring_location_id=USGS-09418500, parameter_code=00060, limit=1
Extract: geometry.coordinates[1] (latitude), geometry.coordinates[0] (longitude)
```

### Step 2: Get Latest Reading
```
Query: /collections/time-series/items
Params: time_series_id={id_from_step1}, sortby=time:D, limit=1
Extract: features[0].properties.value, features[0].properties.time
```

### Step 3: Get 90-Day Series
```
Query: /collections/time-series/items
Params: time_series_id={id_from_step1}, datetime=<90_days_ago>/<today>, sortby=time:A, limit=90
Extract: features[*].{properties.time, properties.value} → array
```

## Important Notes

1. **Time Series ID is Essential**: You cannot fetch observations without first discovering the time series ID from metadata
2. **Multiple Series per Station**: Stations have multiple time series (Instantaneous, Daily Mean, Water Year Max). Always filter for "Daily Mean"
3. **State Name Queries**: When listing stations by state, use full state name (e.g., "Colorado") not abbreviation
4. **Coordinates in GeoJSON**: Remember that GeoJSON uses [longitude, latitude], so swap index [0] and [1]

## Example: Complete Flow for Station 09418500

```bash
# 1. Discover time series
curl "https://api.waterdata.usgs.gov/ogcapi/v0/collections/time-series-metadata/items?monitoring_location_id=USGS-09418500&parameter_code=00060&computation_identifier=Mean&computation_period_identifier=Daily&limit=1&f=json"

# Extract: "id": "ed09a1ca445644afb246a0e18376ca96"

# 2. Fetch latest observation
curl "https://api.waterdata.usgs.gov/ogcapi/v0/collections/time-series/items?time_series_id=ed09a1ca445644afb246a0e18376ca96&sortby=time:D&limit=1&f=json"

# Result: Latest streamflow value with timestamp
```

## Migration from Incorrect Endpoints

**OLD (Incorrect)**:
- `/collections/monitoring-locations/items` — Does not support item-by-ID fetch
- `/collections/daily/items` — Collection doesn't exist
- `/collections/latest/items` — Collection doesn't exist

**NEW (Correct)**:
- `/collections/time-series-metadata/items` — Used for discovery and coordinates
- `/collections/time-series/items` — Used for actual observation data

All service code has been updated to use correct endpoints. No client code changes needed.
