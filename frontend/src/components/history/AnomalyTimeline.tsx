import React from 'react';
import { Box, Typography, Chip } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { AnomalyEventRow } from '../../types/api.types';

export function AnomalyTimeline({ anomalyEvents }: { anomalyEvents: AnomalyEventRow[] }) {
  if (!anomalyEvents || anomalyEvents.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <CheckCircleIcon sx={{ color: 'success.main', fontSize: 40 }} />
        <Typography>No anomalies detected in this period. This station has been stable.</Typography>
      </Box>
    );
  }

  return (
    <Box>
      {anomalyEvents.map((e) => (
        <Box key={e.detectedAt} sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Box sx={{ flex: '0 0 180px' }}>
            <Typography variant="caption">{new Date(e.detectedAt).toLocaleString()}</Typography>
          </Box>
          <Box sx={{ flex: 1 }}>
            <Chip label={e.severity} sx={{ mr: 1 }} color={e.severity === 'severe' ? 'error' : 'warning'} />
            <Typography component="span" sx={{ ml: 1 }}>
              {e.flowValue !== null ? `Flow: ${e.flowValue} ft³/s` : ''}
            </Typography>
            {e.message && (
              <Typography variant="body2" sx={{ mt: 0.5 }}>{e.message}</Typography>
            )}
          </Box>
        </Box>
      ))}
    </Box>
  );
}
