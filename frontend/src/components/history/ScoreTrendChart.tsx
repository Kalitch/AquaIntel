import React from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Box, Typography } from '@mui/material';
import { ScoreTrendPoint } from '../../types/api.types';

export function ScoreTrendChart({ scoreTrend }: { scoreTrend: ScoreTrendPoint[] }) {
  if (!scoreTrend || scoreTrend.length === 0) {
    return <Typography>No score history yet — query a station to start.</Typography>;
  }

  const data = scoreTrend.map((p) => ({ date: p.date, avg: p.avgScore, min: p.minScore, max: p.maxScore }));

  return (
    <Box sx={{ height: 260 }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
          <XAxis dataKey="date" tick={{ fontSize: 12 }} />
          <YAxis domain={[0, 100]} />
          <Tooltip />
          <Area type="monotone" dataKey="avg" stroke="#29b6f6" fill="#29b6f6" />
        </AreaChart>
      </ResponsiveContainer>
    </Box>
  );
}
