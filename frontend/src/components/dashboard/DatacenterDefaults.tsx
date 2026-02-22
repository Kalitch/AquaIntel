import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Divider,
  LinearProgress,
  Tooltip,
} from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import WaterDropIcon from '@mui/icons-material/WaterDrop';
import BoltIcon from '@mui/icons-material/Bolt';
import SmartToyIcon from '@mui/icons-material/SmartToy';

// Real-world estimates for top US AI datacenter hubs
// Sources: Uptime Institute, Lawrence Berkeley National Lab, NRDC reports
const DATACENTER_HUBS = [
  {
    name: 'Northern Virginia',
    shortName: 'N. Virginia',
    subtitle: 'Ashburn — "Data Center Alley"',
    internetTrafficPct: 70,
    estimatedMwCapacity: 3200,
    annualWaterUsageMgal: 1850,
    dailyInferencesM: 420,
    color: '#29b6f6',
    tag: '~70% of world internet traffic',
    tagColor: '#29b6f6',
  },
  {
    name: 'Dallas / Fort Worth',
    shortName: 'Dallas TX',
    subtitle: 'Rapid AI infrastructure growth',
    internetTrafficPct: 12,
    estimatedMwCapacity: 1100,
    annualWaterUsageMgal: 620,
    dailyInferencesM: 145,
    color: '#00e5ff',
    tag: 'Major cloud expansion hub',
    tagColor: '#00e5ff',
  },
  {
    name: 'Phoenix, Arizona',
    shortName: 'Phoenix AZ',
    subtitle: 'Low disaster risk + solar potential',
    internetTrafficPct: 8,
    estimatedMwCapacity: 900,
    annualWaterUsageMgal: 510,
    dailyInferencesM: 118,
    color: '#ffa726',
    tag: 'High solar energy adoption',
    tagColor: '#ffa726',
  },
  {
    name: 'Silicon Valley / Bay Area',
    shortName: 'Bay Area CA',
    subtitle: 'Tech giants & AI startups',
    internetTrafficPct: 9,
    estimatedMwCapacity: 850,
    annualWaterUsageMgal: 480,
    dailyInferencesM: 112,
    color: '#ce93d8',
    tag: 'Founding AI research hub',
    tagColor: '#ce93d8',
  },
  {
    name: 'Columbus, Ohio',
    shortName: 'Columbus OH',
    subtitle: 'Emerging Midwest AI market',
    internetTrafficPct: 4,
    estimatedMwCapacity: 480,
    annualWaterUsageMgal: 270,
    dailyInferencesM: 63,
    color: '#80cbc4',
    tag: 'Fastest-growing cloud market',
    tagColor: '#80cbc4',
  },
];

const CustomBar = (props: {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  fill?: string;
}) => {
  const { x = 0, y = 0, width = 0, height = 0, fill } = props;
  return <rect x={x} y={y} width={width} height={Math.max(height, 2)} fill={fill} rx={3} />;
};

export function DatacenterDefaults() {
  const waterData = DATACENTER_HUBS.map((h) => ({
    name: h.shortName,
    water: h.annualWaterUsageMgal,
    color: h.color,
  }));

  const inferenceData = DATACENTER_HUBS.map((h) => ({
    name: h.shortName,
    inferences: h.dailyInferencesM,
    color: h.color,
  }));

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
        <Typography variant="h6">Top U.S. AI Datacenter Hubs</Typography>
        <Chip label="Estimated" size="small" sx={{ fontSize: 10, height: 18, opacity: 0.6 }} />
      </Box>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 3 }}>
        Select a USGS station above to see live water data. These are industry estimates for
        context — actual usage varies by facility.
      </Typography>

      {/* Hub cards */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mb: 3 }}>
        {DATACENTER_HUBS.map((hub) => (
          <Card key={hub.name} sx={{ borderLeft: `3px solid ${hub.color}` }}>
            <CardContent sx={{ py: '12px !important' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 1 }}>
                <Box sx={{ flex: 1, minWidth: 180 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="subtitle2" fontWeight={700}>
                      {hub.name}
                    </Typography>
                    <Chip
                      label={hub.tag}
                      size="small"
                      sx={{ fontSize: 10, height: 18, bgcolor: `${hub.tagColor}18`, color: hub.tagColor }}
                    />
                  </Box>
                  <Typography variant="caption" color="text.secondary">
                    {hub.subtitle}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                  <Tooltip title="Estimated annual water consumption (million gallons)">
                    <Box sx={{ textAlign: 'right' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, justifyContent: 'flex-end' }}>
                        <WaterDropIcon sx={{ fontSize: 14, color: hub.color }} />
                        <Typography variant="body2" fontWeight={700} sx={{ color: hub.color }}>
                          {hub.annualWaterUsageMgal.toLocaleString()}M gal/yr
                        </Typography>
                      </Box>
                      <Typography variant="caption" color="text.secondary">Water usage est.</Typography>
                    </Box>
                  </Tooltip>
                  <Tooltip title="Estimated daily AI inference requests (millions)">
                    <Box sx={{ textAlign: 'right' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, justifyContent: 'flex-end' }}>
                        <SmartToyIcon sx={{ fontSize: 14, color: hub.color }} />
                        <Typography variant="body2" fontWeight={700} sx={{ color: hub.color }}>
                          {hub.dailyInferencesM}M / day
                        </Typography>
                      </Box>
                      <Typography variant="caption" color="text.secondary">AI inferences est.</Typography>
                    </Box>
                  </Tooltip>
                  <Tooltip title="Estimated installed capacity in megawatts">
                    <Box sx={{ textAlign: 'right' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, justifyContent: 'flex-end' }}>
                        <BoltIcon sx={{ fontSize: 14, color: hub.color }} />
                        <Typography variant="body2" fontWeight={700} sx={{ color: hub.color }}>
                          {hub.estimatedMwCapacity.toLocaleString()} MW
                        </Typography>
                      </Box>
                      <Typography variant="caption" color="text.secondary">Capacity est.</Typography>
                    </Box>
                  </Tooltip>
                </Box>
              </Box>
              {/* Internet traffic share bar */}
              <Box sx={{ mt: 1.5 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant="caption" color="text.secondary">
                    Share of internet traffic processed
                  </Typography>
                  <Typography variant="caption" fontWeight={700} sx={{ color: hub.color }}>
                    ~{hub.internetTrafficPct}%
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={hub.internetTrafficPct}
                  sx={{
                    height: 5,
                    borderRadius: 3,
                    bgcolor: 'rgba(255,255,255,0.06)',
                    '& .MuiLinearProgress-bar': { bgcolor: hub.color },
                  }}
                />
              </Box>
            </CardContent>
          </Card>
        ))}
      </Box>

      <Divider sx={{ mb: 3 }} />

      {/* Charts row */}
      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        {/* Water usage chart */}
        <Card sx={{ flex: '1 1 300px' }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <WaterDropIcon sx={{ color: 'primary.main', fontSize: 18 }} />
              <Typography variant="subtitle2" color="text.secondary">
                Annual Water Usage (Million Gallons)
              </Typography>
            </Box>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={waterData} margin={{ top: 0, right: 10, left: -10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis
                  dataKey="name"
                  tick={{ fill: '#90a4ae', fontSize: 10 }}
                  tickLine={false}
                  angle={-20}
                  textAnchor="end"
                />
                <YAxis tick={{ fill: '#90a4ae', fontSize: 10 }} tickLine={false} axisLine={false} />
                <RechartsTooltip
                  contentStyle={{ backgroundColor: '#0a1929', border: '1px solid rgba(255,255,255,0.1)', fontSize: 12 }}
                  formatter={(v: number) => [`${v.toLocaleString()}M gal`, 'Water']}
                />
                <Bar dataKey="water" radius={[3, 3, 0, 0]} shape={<CustomBar />}>
                  {waterData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* AI inferences chart */}
        <Card sx={{ flex: '1 1 300px' }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <SmartToyIcon sx={{ color: 'secondary.main', fontSize: 18 }} />
              <Typography variant="subtitle2" color="text.secondary">
                Daily AI Inference Capacity (Millions)
              </Typography>
            </Box>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={inferenceData} margin={{ top: 0, right: 10, left: -10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis
                  dataKey="name"
                  tick={{ fill: '#90a4ae', fontSize: 10 }}
                  tickLine={false}
                  angle={-20}
                  textAnchor="end"
                />
                <YAxis tick={{ fill: '#90a4ae', fontSize: 10 }} tickLine={false} axisLine={false} />
                <RechartsTooltip
                  contentStyle={{ backgroundColor: '#0a1929', border: '1px solid rgba(255,255,255,0.1)', fontSize: 12 }}
                  formatter={(v: number) => [`${v}M requests`, 'AI Inferences']}
                />
                <Bar dataKey="inferences" radius={[3, 3, 0, 0]} shape={<CustomBar />}>
                  {inferenceData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </Box>

      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2, fontStyle: 'italic' }}>
        Estimates derived from Uptime Institute, Lawrence Berkeley National Laboratory, and NRDC
        reports. Select a live USGS station above to see real water flow data and AI impact calculations.
      </Typography>
    </Box>
  );
}
