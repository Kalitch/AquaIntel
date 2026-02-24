import React from 'react';
import {
  Box,
  Typography,
  LinearProgress,
  useTheme,
} from '@mui/material';
import { FlowPercentiles } from '../../types/api.types';

const percentileTextColor = (percentile: number | null): string => {
  if (percentile === null) return 'text.secondary';
  if (percentile <= 10) return '#c62828';
  if (percentile <= 25) return '#ef6c00';
  if (percentile <= 75) return '#66bb6a';
  if (percentile <= 90) return '#29b6f6';
  return '#7b1fa2';
};

export function PercentileBar({
  percentiles,
  currentValue,
}: {
  percentiles: FlowPercentiles | null;
  currentValue: number | null;
}) {
  const theme = useTheme();

  if (!percentiles) {
    return null;
  }

  return (
    <Box>
      {/* Interpretation text */}
      <Typography
        variant="caption"
        sx={{
          color: percentileTextColor(percentiles.currentPercentile),
          display: 'block',
          mb: 1,
          fontWeight: 500,
        }}
      >
        {percentiles.interpretation}
      </Typography>

      {/* Percentile scale bar */}
      <Box sx={{ position: 'relative', mb: 1 }}>
        <Box
          sx={{
            position: 'relative',
            height: 8,
            backgroundColor: 'rgba(255,255,255,0.08)',
            borderRadius: 1,
            overflow: 'hidden',
          }}
        >
          {/* Filled progress background */}
          {percentiles.currentPercentile !== null && (
            <Box
              sx={{
                position: 'absolute',
                height: '100%',
                width: `${Math.min(percentiles.currentPercentile, 100)}%`,
                backgroundColor: percentileTextColor(
                  percentiles.currentPercentile,
                ),
                borderRadius: 1,
              }}
            />
          )}
        </Box>

        {/* Percentile tick marks and labels */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            mt: 0.5,
            px: 0.5,
          }}
        >
          {[
            { p: percentiles.p10, label: 'p10' },
            { p: percentiles.p25, label: 'p25' },
            { p: percentiles.p50, label: 'p50' },
            { p: percentiles.p75, label: 'p75' },
            { p: percentiles.p90, label: 'p90' },
          ].map(
            ({ p, label }) =>
              p !== null && (
                <Box key={label}>
                  <Typography variant="caption" sx={{ fontSize: '0.65rem' }}>
                    {label}: {p?.toLocaleString(undefined, {
                      maximumFractionDigits: 0,
                    })}
                  </Typography>
                </Box>
              ),
          )}
        </Box>
      </Box>

      {/* Record years caption */}
      {percentiles.recordYears !== null && (
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
          Based on {percentiles.recordYears} years of historical record
        </Typography>
      )}
    </Box>
  );
}
