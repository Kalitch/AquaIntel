import React from 'react';
import { Chip, Tooltip } from '@mui/material';
import WaterDropIcon from '@mui/icons-material/WaterDrop';
import { DroughtStatus } from '../../types/api.types';

const severityColors: Record<string, string> = {
  'None': '#ffffff',
  'D0 - Abnormally Dry': '#fdd835',
  'D1 - Moderate Drought': '#ffa726',
  'D2 - Severe Drought': '#ef6c00',
  'D3 - Extreme Drought': '#c62828',
  'D4 - Exceptional Drought': '#7b1fa2',
};

export function DroughtBadge({ drought }: { drought: DroughtStatus | null | undefined }) {
  if (!drought || drought.severity === 'None') {
    return null;
  }

  const color = severityColors[drought.severity] || '#ffffff';
  const tooltipText = `${drought.county}, ${drought.stateAbbr} — valid week of ${drought.validStart}`;

  return (
    <Tooltip title={tooltipText}>
      <Chip
        icon={<WaterDropIcon />}
        label={drought.severity}
        style={{
          backgroundColor: `${color}20`,
          color,
          borderColor: color,
          borderWidth: 1,
        }}
        variant="outlined"
        size="small"
      />
    </Tooltip>
  );
}
