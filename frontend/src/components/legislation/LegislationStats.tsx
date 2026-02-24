import React from 'react';
import { Box, Stack, Typography, Switch, Chip } from '@mui/material';
import { LegislationResponse } from '../../types/api.types';
import { formatNumber, formatDate } from '../../utils/formatters';
import { ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';

const STATUS_COLORS: Record<string, string> = {
  introduced: '#29b6f6',
  committee: '#ffa726',
  passed_chamber: '#26c6da',
  signed: '#66bb6a',
  vetoed: '#ef5350',
  failed: '#90a4ae',
  monitoring: '#ce93d8',
};

export function LegislationStats({ data, aiOnly, onAiOnlyChange }: {
  data: LegislationResponse;
  aiOnly: boolean;
  onAiOnlyChange: (val: boolean) => void;
}) {
  const statusKeys = Object.keys(data.byStatus);
  const chartData = statusKeys.map((k) => ({ name: k, value: data.byStatus[k as keyof typeof data.byStatus] ?? 0 }));

  return (
    <Box sx={{ p: 2, bgcolor: 'background.paper', borderRadius: 1, mb: 2 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Box>
          <Typography variant="h6">{data.totalBills} bills tracked</Typography>
          <Typography variant="caption" color="text.secondary">
            Federal: {data.byScope.federal} • State: {data.byScope.state} • Last updated: {formatDate(data.lastUpdated)}
          </Typography>
        </Box>
        <Box>
          <Chip label="AI-related only" sx={{ mr: 1 }} />
          <Switch checked={aiOnly} onChange={(_, v) => onAiOnlyChange(v)} />
        </Box>
      </Stack>

      <Box sx={{ height: 60, mt: 2 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} layout="vertical">
            <Bar dataKey="value">
              {chartData.map((entry) => (
                <Cell key={entry.name} fill={STATUS_COLORS[entry.name] ?? '#ccc'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Box>
    </Box>
  );
}
