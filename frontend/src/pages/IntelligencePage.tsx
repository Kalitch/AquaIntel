import React from 'react';
import {
  Box,
  Card,
  CardContent,
  CircularProgress,
  Typography,
  Alert,
  Grid,
} from '@mui/material';
import { IntelligencePanel } from '../components/intelligence/IntelligencePanel';
import { AiImpactCards } from '../components/dashboard/AiImpactCards';
import { StationSearch } from '../components/dashboard/StationSearch';
import { DroughtBadge } from '../components/shared/DroughtBadge';
import { PercentileBar } from '../components/dashboard/PercentileBar';
import { useStation } from '../hooks/useStation';
import { useIntelligence } from '../hooks/useApi';
import { NarrativePanel } from '../components/intelligence/NarrativePanel';

export function IntelligencePage() {
  const { stationId, stationName, setStation } = useStation();
  const { data, loading, error } = useIntelligence(stationId);

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Intelligence Panel
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={3}>
        Deterministic AI-powered analytics: anomaly detection, volatility, and sustainability scoring.
      </Typography>

      {!stationId && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Select a Station
            </Typography>
            <StationSearch onSelect={setStation} />
          </CardContent>
        </Card>
      )}

      {stationId && (
        <>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
            <Typography variant="h6" color="primary">
              {stationName || stationId}
            </Typography>
            <DroughtBadge drought={data?.droughtStatus ?? null} />
          </Box>

          {loading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          )}

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          {data && !loading && (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Historical Context
                    </Typography>
                    <PercentileBar
                      percentiles={data.percentiles}
                      currentValue={data.water.latest?.value ?? null}
                    />
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={6}>
                <IntelligencePanel analytics={data.analytics} stationId={stationId} />
              </Grid>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      AI Impact Summary
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
                      All values computed server-side using configurable constants.
                    </Typography>
                    <AiImpactCards aiImpact={data.aiImpact} />
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}
          {data && !loading && (
            <Box sx={{ mt: 3 }}>
              <NarrativePanel />
            </Box>
          )}
        </>
      )}
    </Box>
  );
}
