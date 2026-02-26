import React, { useState, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  CircularProgress,
  Typography,
  Alert,
  TextField,
  Button,
} from '@mui/material';
import { HistoricalChart } from '../components/charts/HistoricalChart';
import { StationSearch } from '../components/dashboard/StationSearch';
import { useStation } from '../hooks/useStation';
import { useIntelligence } from '../hooks/useApi';

export function HistoricalPage() {
  const { stationId, stationName, setStation } = useStation();
  const { data, loading, error } = useIntelligence(stationId);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const filteredSeries = useMemo(() => {
    if (!data?.water.dailySeries) return [];
    let series = data.water.dailySeries;
    if (startDate) series = series.filter((d) => d.date >= startDate);
    if (endDate) series = series.filter((d) => d.date <= endDate);
    return series;
  }, [data, startDate, endDate]);

  const unit = data?.water.latest?.unit ?? 'ft³/s';

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Historical View
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={3}>
        90-day flow history with moving averages and anomaly detection.
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
          <Typography variant="h6" color="primary" gutterBottom>
            {stationName || stationId}
          </Typography>

          {/* Date range filter */}
          <Card sx={{ mb: 3 }} hidden={true}>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Date Range Filter
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
                <TextField
                  label="Start Date"
                  type="date"
                  size="small"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
                <TextField
                  label="End Date"
                  type="date"
                  size="small"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => { setStartDate(''); setEndDate(''); }}
                >
                  Reset
                </Button>
              </Box>
            </CardContent>
          </Card>

          {loading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          )}

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          {data && !loading && (
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Flow Rate Over Time ({unit})
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {filteredSeries.length} data points
                  </Typography>
                </Box>
                <HistoricalChart
                  series={filteredSeries}
                  ma7={data.analytics.movingAverage7}
                  ma30={data.analytics.movingAverage30}
                  unit={unit}
                />
              </CardContent>
            </Card>
          )}
        </>
      )}
    </Box>
  );
}
