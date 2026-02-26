import React from 'react';
import { Box, Typography, Alert } from '@mui/material';
import { usePlatformSummary } from '../hooks/useApi';
import { useStation } from '../hooks/useStation';
import { PlatformStatsPanel } from '../components/history/PlatformStatsPanel';
import { StationHistoryPanel } from '../components/history/StationHistoryPanel';

export function PlatformHistoryPage() {
  const { data, loading, error } = usePlatformSummary();
  const { stationId } = useStation();

  return (
    <Box>
      <Typography variant="h4">AquaIntel Platform History</Typography>
      <Typography variant="subtitle1">Every intelligence query is recorded. This is AquaIntel's own memory — independent of USGS.</Typography>

      {error && <Alert severity="error">{error}</Alert>}

      {data && <PlatformStatsPanel summary={data} />}

      <Box sx={{ mt: 4 }}>
        <StationHistoryPanel stationId={stationId ?? null} />
      </Box>
    </Box>
  );
}
