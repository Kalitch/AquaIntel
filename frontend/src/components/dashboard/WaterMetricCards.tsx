import React from 'react';
import { Box, Card, CardContent, Typography, Chip } from '@mui/material';
import WaterDropIcon from '@mui/icons-material/WaterDrop';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import ScienceIcon from '@mui/icons-material/Science';
import { WaterReading, DroughtStatus, FlowPercentiles } from '../../types/api.types';
import { formatNumber } from '../../utils/formatters';
import { DroughtBadge } from '../shared/DroughtBadge';
import { PercentileBar } from './PercentileBar';

interface WaterMetricCardsProps {
  latest: WaterReading | null;
  sustainabilityScore: number;
  scoreLabel: string;
  scoreColor: string;
  drought?: DroughtStatus | null;
  percentiles?: FlowPercentiles | null;
}

export function WaterMetricCards({
  latest,
  sustainabilityScore,
  scoreLabel,
  scoreColor,
  drought,
  percentiles,
}: WaterMetricCardsProps) {
  if (!latest) {
    return (
      <Typography color="text.secondary" variant="body2">
        No current reading available for this station.
      </Typography>
    );
  }

  const cards = [
    {
      label: 'Current Flow',
      value: formatNumber(latest.value, 2),
      unit: latest.unit,
      icon: <WaterDropIcon fontSize="large" />,
      color: '#29b6f6',
      hasChild: true, // Show percentile bar below
    },
    {
      label: 'Parameter',
      value: latest.parameter,
      unit: '',
      icon: <ScienceIcon fontSize="large" />,
      color: '#00e5ff',
    },
    {
      label: 'Last Reading',
      value: new Date(latest.timestamp).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      }),
      unit: new Date(latest.timestamp).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      }),
      icon: <AccessTimeIcon fontSize="large" />,
      color: '#4dd0e1',
    },
  ];

  return (
    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', flexDirection: 'column' }}>
      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        {cards.map((card) => (
          <Card key={card.label} sx={{ flex: '1 1 160px', minWidth: 150 }}>
            <CardContent>
              <Box sx={{ color: card.color, mb: 1 }}>{card.icon}</Box>
              <Typography variant="h5" fontWeight={700}>
                {card.value}
              </Typography>
              {card.unit && (
                <Typography variant="caption" color="text.secondary">
                  {card.unit}
                </Typography>
              )}
              <Typography variant="body2" color="text.secondary" mt={0.5}>
                {card.label}
              </Typography>
              {card.hasChild && percentiles && (
                <Box sx={{ mt: 1.5, pt: 1.5, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                  <PercentileBar
                    percentiles={percentiles}
                    currentValue={latest.value}
                  />
                </Box>
              )}
            </CardContent>
          </Card>
        ))}

        <Card sx={{ flex: '1 1 160px', minWidth: 150 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Sustainability Score
              </Typography>
              <DroughtBadge drought={drought} />
            </Box>
            <Typography variant="h3" fontWeight={800} sx={{ color: scoreColor }}>
              {sustainabilityScore}
            </Typography>
            <Chip
              label={scoreLabel}
              size="small"
              sx={{
                bgcolor: `${scoreColor}22`,
                color: scoreColor,
                fontWeight: 700,
                mt: 1,
              }}
            />
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}
