import React from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Scatter,
  ReferenceLine,
} from 'recharts';
import { Box, Typography } from '@mui/material';
import { DailyWaterValue } from '../../types/api.types';
import { formatDate } from '../../utils/formatters';

interface ChartDataPoint {
  date: string;
  value: number;
  ma7?: number;
  ma30?: number;
  anomalyValue?: number;
  severeValue?: number;
}

interface HistoricalChartProps {
  series: DailyWaterValue[];
  ma7: number | null;
  ma30: number | null;
  unit: string;
}

function buildChartData(
  series: DailyWaterValue[],
  globalMa7: number | null,
  globalMa30: number | null,
): ChartDataPoint[] {
  return series.map((d, i) => {
    const windowSlice = series.slice(Math.max(0, i - 6), i + 1).map((x) => x.value);
    const localMa7 =
      windowSlice.length > 0
        ? windowSlice.reduce((a, b) => a + b, 0) / windowSlice.length
        : null;

    const window30Slice = series.slice(Math.max(0, i - 29), i + 1).map((x) => x.value);
    const localMa30 =
      window30Slice.length > 0
        ? window30Slice.reduce((a, b) => a + b, 0) / window30Slice.length
        : null;

    return {
      date: formatDate(d.date),
      value: Math.round(d.value * 100) / 100,
      ma7: localMa7 ? Math.round(localMa7 * 100) / 100 : undefined,
      ma30: localMa30 ? Math.round(localMa30 * 100) / 100 : undefined,
      anomalyValue: d.isAnomaly && !d.isSevere ? d.value : undefined,
      severeValue: d.isSevere ? d.value : undefined,
    };
  });
}

const CustomTooltip = ({
  active,
  payload,
  label,
  unit,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
  unit: string;
}) => {
  if (!active || !payload?.length) return null;
  return (
    <Box
      sx={{
        bgcolor: 'background.paper',
        p: 1.5,
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 1,
      }}
    >
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      {payload.map((entry) => (
        <Box key={entry.name} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: entry.color }} />
          <Typography variant="caption">
            {entry.name}: {entry.value} {unit}
          </Typography>
        </Box>
      ))}
    </Box>
  );
};

export function HistoricalChart({ series, ma7, ma30, unit }: HistoricalChartProps) {
  if (series.length === 0) {
    return (
      <Typography color="text.secondary" variant="body2">
        No historical data available.
      </Typography>
    );
  }

  const data = buildChartData(series, ma7, ma30);

  return (
    <ResponsiveContainer width="100%" height={320}>
      <ComposedChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
        <XAxis
          dataKey="date"
          tick={{ fill: '#90a4ae', fontSize: 11 }}
          tickLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          tick={{ fill: '#90a4ae', fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => `${v}`}
        />
        <Tooltip content={<CustomTooltip unit={unit} />} />
        <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />

        <Line
          type="monotone"
          dataKey="value"
          name={`Flow (${unit})`}
          stroke="#29b6f6"
          strokeWidth={1.5}
          dot={false}
          activeDot={{ r: 4 }}
        />
        <Line
          type="monotone"
          dataKey="ma7"
          name="7-Day MA"
          stroke="#00e5ff"
          strokeWidth={2}
          dot={false}
          strokeDasharray="4 2"
        />
        <Line
          type="monotone"
          dataKey="ma30"
          name="30-Day MA"
          stroke="#4dd0e1"
          strokeWidth={1.5}
          dot={false}
          strokeDasharray="8 4"
          opacity={0.7}
        />

        {/* Anomaly markers */}
        <Scatter
          dataKey="anomalyValue"
          name="Anomaly"
          fill="#ffa726"
          r={5}
          shape="triangle"
        />
        <Scatter
          dataKey="severeValue"
          name="Severe Anomaly"
          fill="#ef5350"
          r={6}
          shape="star"
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
