import React from 'react';
import { Box, Grid, Paper, Typography, List, ListItem, ListItemText, Divider } from '@mui/material';
import StorageIcon from '@mui/icons-material/Storage';
import WarningIcon from '@mui/icons-material/Warning';
import WaterIcon from '@mui/icons-material/Water';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import { PlatformSummary } from '../../types/api.types';

export function PlatformStatsPanel({ summary }: { summary: PlatformSummary }) {
  return (
    <Box>
      <Grid container spacing={2}>
        <Grid item xs={3}>
          <Paper sx={{ p: 2 }}>
            <StorageIcon color="primary" />
            <Typography variant="h6">{summary.totalSnapshots}</Typography>
            <Typography variant="caption">Total Snapshots</Typography>
          </Paper>
        </Grid>
        <Grid item xs={3}>
          <Paper sx={{ p: 2 }}>
            <WarningIcon color="warning" />
            <Typography variant="h6">{summary.totalAnomalyEvents}</Typography>
            <Typography variant="caption">Anomaly Events</Typography>
          </Paper>
        </Grid>
        <Grid item xs={3}>
          <Paper sx={{ p: 2 }}>
            <WaterIcon color="primary" />
            <Typography variant="h6">{summary.totalStationsTracked}</Typography>
            <Typography variant="caption">Stations Tracked</Typography>
          </Paper>
        </Grid>
        <Grid item xs={3}>
          <Paper sx={{ p: 2 }}>
            <TrendingUpIcon color="success" />
            <Typography variant="h6">{summary.snapshotsLast24h}</Typography>
            <Typography variant="caption">Snapshots last 24h</Typography>
          </Paper>
        </Grid>
      </Grid>

      <Box sx={{ display: 'flex', mt: 2, gap: 2 }}>
        <Paper sx={{ flex: 1, p: 2 }}>
          <Typography variant="subtitle1">Most Queried Stations</Typography>
          <List>
            {summary.mostQueriedStations.slice(0, 5).map((s) => (
              <ListItem key={s.stationId}>
                <ListItemText primary={s.stationId} secondary={`${s.totalQueries} queries • ${new Date(s.lastSeen).toLocaleString()}`} />
              </ListItem>
            ))}
          </List>
        </Paper>

        <Paper sx={{ flex: 1, p: 2 }}>
          <Typography variant="subtitle1">Recent Anomalies</Typography>
          <List>
            {summary.recentAnomalies.slice(0, 5).map((a) => (
              <ListItem key={`${a.stationId}-${a.detectedAt}`}>
                <ListItemText primary={`${a.stationId} • ${a.severity}`} secondary={new Date(a.detectedAt).toLocaleString()} />
              </ListItem>
            ))}
          </List>
        </Paper>
      </Box>
    </Box>
  );
}
