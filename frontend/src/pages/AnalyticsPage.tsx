import React from 'react';
import {
  Box,
  Card,
  CardContent,
  CircularProgress,
  Typography,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Chip,
  LinearProgress,
} from '@mui/material';
import { useAnalytics } from '../hooks/useApi';
import { formatNumber } from '../utils/formatters';

export function AnalyticsPage() {
  const { summary, loading, error } = useAnalytics();

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  const endpointEntries = summary
    ? Object.entries(summary.endpointBreakdown).sort(
        ([, a], [, b]) => b.count - a.count,
      )
    : [];

  const maxCount = endpointEntries[0]?.[1]?.count ?? 1;

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Platform Analytics
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={3}>
        Real-time observability metrics for the Water Intelligence Platform.
      </Typography>

      {summary && (
        <>
          {/* Summary KPIs */}
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 3 }}>
            {[
              { label: 'Total Requests', value: formatNumber(summary.totalRequests) },
              { label: 'Avg Response Time', value: `${summary.averageResponseTimeMs}ms` },
              {
                label: 'Error Rate',
                value:
                  summary.totalRequests > 0
                    ? `${((summary.totalErrors / summary.totalRequests) * 100).toFixed(1)}%`
                    : '0%',
              },
              {
                label: 'Uptime Since',
                value: new Date(summary.uptimeSince).toLocaleString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                }),
              },
            ].map((kpi) => (
              <Card key={kpi.label} sx={{ flex: '1 1 150px' }}>
                <CardContent>
                  <Typography variant="h5" fontWeight={700} color="primary">
                    {kpi.value}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {kpi.label}
                  </Typography>
                </CardContent>
              </Card>
            ))}
          </Box>

          {/* Endpoint breakdown */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Requests by Endpoint
              </Typography>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Endpoint</TableCell>
                    <TableCell align="right">Requests</TableCell>
                    <TableCell align="right">Avg ms</TableCell>
                    <TableCell align="right">Error Rate</TableCell>
                    <TableCell sx={{ width: '25%' }}>Traffic</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {endpointEntries.map(([endpoint, stat]) => (
                    <TableRow key={endpoint}>
                      <TableCell>
                        <Typography variant="caption" fontFamily="monospace">
                          {endpoint}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">{stat.count}</TableCell>
                      <TableCell align="right">{stat.avgResponseTimeMs}</TableCell>
                      <TableCell align="right">
                        <Chip
                          label={`${(stat.errorRate * 100).toFixed(0)}%`}
                          size="small"
                          color={stat.errorRate > 0.1 ? 'error' : 'success'}
                          sx={{ height: 20, fontSize: 11 }}
                        />
                      </TableCell>
                      <TableCell>
                        <LinearProgress
                          variant="determinate"
                          value={(stat.count / maxCount) * 100}
                          sx={{ height: 6, borderRadius: 3 }}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                  {endpointEntries.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} align="center">
                        <Typography variant="caption" color="text.secondary">
                          No requests recorded yet
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Top stations */}
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Most Queried Stations
              </Typography>
              {summary.topStations.length === 0 ? (
                <Typography variant="caption" color="text.secondary">
                  No station queries yet.
                </Typography>
              ) : (
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Station ID</TableCell>
                      <TableCell align="right">Queries</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {summary.topStations.map((s, i) => (
                      <TableRow key={s.stationId}>
                        <TableCell>
                          <Chip
                            label={`#${i + 1}`}
                            size="small"
                            sx={{ mr: 1, height: 18, fontSize: 10 }}
                          />
                          <Typography
                            component="span"
                            variant="caption"
                            fontFamily="monospace"
                          >
                            {s.stationId}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">{s.queryCount}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </Box>
  );
}
