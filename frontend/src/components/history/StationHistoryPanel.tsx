import React, { useState } from 'react';
import { Box, Typography, CircularProgress, Alert, Divider, ButtonGroup, Button } from '@mui/material';
import { useStationHistory } from '../../hooks/useApi';
import { ScoreTrendChart } from './ScoreTrendChart';
import { AnomalyTimeline } from './AnomalyTimeline';

export function StationHistoryPanel({ stationId }: { stationId: string | null }) {
  const [days, setDays] = useState(90);
  const { data, loading, error } = useStationHistory(stationId, days);

  if (!stationId) return <Typography>Select a station to view its AquaIntel history record.</Typography>;
  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>;
  if (error) return <Alert severity="error">{error}</Alert>;

  if (data && data.totalSnapshots === 0) {
    return <Alert severity="info">No history yet for this station. Query it on the Dashboard to start recording.</Alert>;
  }

  return (
    <Box>
      <Typography variant="h5">AquaIntel History — Station {stationId}</Typography>
      <Typography variant="caption">{data ? `${data.totalSnapshots} observations recorded` : ''}</Typography>

      <Box sx={{ my: 2 }}>
        <ButtonGroup variant="outlined">
          <Button onClick={() => setDays(30)}>30d</Button>
          <Button onClick={() => setDays(60)}>60d</Button>
          <Button onClick={() => setDays(90)}>90d</Button>
        </ButtonGroup>
      </Box>

      {data && <ScoreTrendChart scoreTrend={data.scoreTrend} />}

      <Divider sx={{ my: 2 }} />

      <Typography variant="h6">Anomaly Events</Typography>
      {data && <AnomalyTimeline anomalyEvents={data.anomalyEvents} />}
    </Box>
  );
}
