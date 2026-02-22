import React from 'react';
import { Box, Card, CardContent, Typography, Tooltip, IconButton } from '@mui/material';
import BoltIcon from '@mui/icons-material/Bolt';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import MemoryIcon from '@mui/icons-material/Memory';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import { AiImpact } from '../../types/api.types';
import { formatNumber } from '../../utils/formatters';

interface AiImpactCardsProps {
  aiImpact: AiImpact | null;
}

export function AiImpactCards({ aiImpact }: AiImpactCardsProps) {
  if (!aiImpact) {
    return (
      <Typography color="text.secondary" variant="body2">
        AI impact data not available.
      </Typography>
    );
  }

  const cards = [
    {
      label: 'Energy Equivalent',
      value: formatNumber(aiImpact.kwhEquivalent),
      unit: 'kWh / hour',
      icon: <BoltIcon fontSize="large" />,
      color: '#ffd54f',
      tooltip: `Based on ${aiImpact.modelConstants.waterPerKwh} L water per kWh (data center cooling average)`,
    },
    {
      label: 'AI Inferences',
      value: formatNumber(aiImpact.inferenceEquivalent),
      unit: 'requests / hour',
      icon: <SmartToyIcon fontSize="large" />,
      color: '#ce93d8',
      tooltip: `At ${aiImpact.modelConstants.kwhPerInference} kWh per inference (large model estimate)`,
    },
    {
      label: 'GPU Training',
      value: formatNumber(aiImpact.gpuHoursEquivalent),
      unit: 'GPU hours / hour',
      icon: <MemoryIcon fontSize="large" />,
      color: '#80cbc4',
      tooltip: `At ${aiImpact.modelConstants.kwhPerGpuTrainingHour} kWh per GPU-hour (A100-class)`,
    },
  ];

  return (
    <Box>
      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
        {cards.map((card) => (
          <Card key={card.label} sx={{ flex: '1 1 160px', minWidth: 150 }}>
            <CardContent>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                }}
              >
                <Box sx={{ color: card.color }}>{card.icon}</Box>
                <Tooltip title={card.tooltip} arrow>
                  <IconButton size="small" sx={{ p: 0 }}>
                    <HelpOutlineIcon sx={{ fontSize: 14, color: 'text.disabled' }} />
                  </IconButton>
                </Tooltip>
              </Box>
              <Typography variant="h5" fontWeight={700} mt={1}>
                {card.value}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {card.unit}
              </Typography>
              <Typography variant="body2" color="text.secondary" mt={0.5}>
                {card.label}
              </Typography>
            </CardContent>
          </Card>
        ))}
      </Box>
      <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
        {aiImpact.explanation}
      </Typography>
    </Box>
  );
}
