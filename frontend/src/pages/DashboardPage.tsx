import React from 'react';
import {
  Box,
  Card,
  CardContent,
  CircularProgress,
  Divider,
  Typography,
  Alert,
  Chip,
} from '@mui/material';
import WaterDropIcon from '@mui/icons-material/WaterDrop';
import { StationSearch } from '../components/dashboard/StationSearch';
import { WaterMetricCards } from '../components/dashboard/WaterMetricCards';
import { AiImpactCards } from '../components/dashboard/AiImpactCards';
import { DatacenterDefaults } from '../components/dashboard/DatacenterDefaults';
import { WatchlistPanel } from '../components/dashboard/WatchlistPanel';
import { useStation } from '../hooks/useStation';
import { useIntelligence } from '../hooks/useApi';
import { scoreToColor, scoreToLabel } from '../utils/formatters';

export function DashboardPage() {
  const { stationId, stationName, setStation } = useStation();
  const { data, loading, error } = useIntelligence(stationId);

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
        <WaterDropIcon sx={{ color: 'primary.main' }} />
        <Typography variant="h4">Dashboard</Typography>
      </Box>
      {/* Default content — always shown */}
      <DatacenterDefaults />
      <Divider sx={{ mb: 3 }} />
      <Typography variant="body2" color="text.secondary" mb={3}>
        Real-time water intelligence from USGS monitoring stations. Select a station to see live
        data, or explore AI datacenter water context below.
      </Typography>

      {/* Station search — always visible at top */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <Typography variant="h6">Select a USGS Monitoring Station</Typography>
            <Chip
              label="Live Data"
              size="small"
              color="success"
              sx={{ height: 20, fontSize: 10 }}
            />
          </Box>
          <StationSearch onSelect={setStation} />
          {stationId && (
            <Box sx={{ mt: 2, p: 1.5, bgcolor: 'rgba(41,182,246,0.08)', borderRadius: 1 }}>
              <Typography variant="caption" color="primary">
                Active station: <strong>{stationName || stationId}</strong> (ID: {stationId})
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Watched stations */}
      <WatchlistPanel />

      {/* Live station data */}
      {stationId && (
        <Box sx={{ mb: 4 }}>
          {loading && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 3 }}>
              <CircularProgress size={24} />
              <Typography color="text.secondary" variant="body2">
                Fetching USGS data for station {stationId}…
              </Typography>
            </Box>
          )}

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error} — try a different station or check the station ID.
            </Alert>
          )}

          {data && !loading && (
            <>
              {/* No data state */}
              {data.water.latest === null && data.water.dailySeries.length === 0 && (
                <Alert severity="warning" sx={{ mb: 2 }}>
                  No streamflow data found for station <strong>{stationId}</strong>. This station
                  may not report discharge (parameter 00060). Try selecting a different station.
                </Alert>
              )}

              {(data.water.latest !== null || data.water.dailySeries.length > 0) && (
                <>
                  <Card sx={{ mb: 3 }}>
                    <CardContent>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Current Water Metrics
                      </Typography>
                      <Divider sx={{ mb: 2 }} />
                      <WaterMetricCards
                        latest={data.water.latest}
                        sustainabilityScore={data.analytics.sustainabilityScore}
                        scoreLabel={scoreToLabel(data.analytics.sustainabilityScore)}
                        scoreColor={scoreToColor(data.analytics.sustainabilityScore)}
                        drought={data.droughtStatus}
                        percentiles={data.percentiles}
                      />
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                        <Typography variant="subtitle2" color="text.secondary">
                          AI Sustainability Equivalents
                        </Typography>
                        <Chip
                          label="Deterministic — no AI APIs"
                          size="small"
                          sx={{ fontSize: 10, height: 18, opacity: 0.7 }}
                        />
                      </Box>
                      <Divider sx={{ mb: 2 }} />
                      <AiImpactCards aiImpact={data.aiImpact} />
                    </CardContent>
                  </Card>
                </>
              )}
            </>
          )}
        </Box>
      )}

      <Divider sx={{ mb: 3 }} />

      
    </Box>
  );
}
