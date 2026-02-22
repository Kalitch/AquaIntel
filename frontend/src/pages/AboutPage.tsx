import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Divider,
  Typography,
  Alert,
  Chip,
} from '@mui/material';
import WaterIcon from '@mui/icons-material/Water';
import PsychologyIcon from '@mui/icons-material/Psychology';
import BoltIcon from '@mui/icons-material/Bolt';
import VerifiedIcon from '@mui/icons-material/Verified';

const Section = ({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) => (
  <Card sx={{ mb: 2 }}>
    <CardContent>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
        <Box sx={{ color: 'primary.main' }}>{icon}</Box>
        <Typography variant="h6">{title}</Typography>
      </Box>
      <Divider sx={{ mb: 2 }} />
      {children}
    </CardContent>
  </Card>
);

export function AboutPage() {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        About This Platform
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={3}>
        Transparency, explainability, and real data — no black boxes.
      </Typography>

      <Section icon={<WaterIcon />} title="USGS Data Source">
        <Typography variant="body2" paragraph>
          All water measurements come from the U.S. Geological Survey (USGS) Water Data API
          — a federal service providing real-time and historical hydrological data for
          thousands of monitoring stations across the United States.
        </Typography>
        <Typography variant="body2" paragraph>
          The API endpoint used is the OGC-compliant interface at{' '}
          <code>api.waterdata.usgs.gov/ogcapi/v0</code>. No data is mocked or simulated.
          Each query returns real measurements from physical stream gauges, wells, and
          monitoring sites.
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Chip label="Real-time data" size="small" color="primary" />
          <Chip label="Federal open data" size="small" color="primary" />
          <Chip label="No mock data" size="small" color="success" />
        </Box>
      </Section>

      <Section icon={<PsychologyIcon />} title="Deterministic AI Modeling">
        <Typography variant="body2" paragraph>
          The intelligence engine is fully deterministic — there are no neural networks,
          no external AI APIs, and no probabilistic black boxes. Every result is
          reproducible and explainable.
        </Typography>
        <Typography variant="body2" component="div">
          The analytics engine computes:
          <ul>
            <li><strong>7-day moving average:</strong> arithmetic mean of the last 7 daily values</li>
            <li><strong>30-day moving average:</strong> arithmetic mean of the last 30 daily values</li>
            <li><strong>Volatility index:</strong> coefficient of variation = stdDev / mean</li>
            <li>
              <strong>Anomaly detection (rule-based):</strong> if today &gt; MA7 × 1.5 →
              moderate; if today &gt; MA7 × 2.0 → severe
            </li>
          </ul>
        </Typography>
      </Section>

      <Section icon={<BoltIcon />} title="Sustainability Score Logic">
        <Typography variant="body2" paragraph>
          The sustainability score (0–100) reflects the hydrological stability of a station.
          It starts at 100 and deductions are applied as follows:
        </Typography>
        <Box
          component="table"
          sx={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}
        >
          <thead>
            <tr>
              <th style={{ textAlign: 'left', padding: '4px 8px', opacity: 0.7 }}>Condition</th>
              <th style={{ textAlign: 'right', padding: '4px 8px', opacity: 0.7 }}>Deduction</th>
            </tr>
          </thead>
          <tbody>
            {[
              ['High volatility (index > 0.5)', '−20'],
              ['Severe anomaly detected', '−30'],
              ['Moderate anomaly detected', '−15'],
              ['Flow below 10th percentile', '−15'],
            ].map(([condition, deduction]) => (
              <tr key={condition}>
                <td style={{ padding: '4px 8px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                  {condition}
                </td>
                <td
                  style={{
                    padding: '4px 8px',
                    textAlign: 'right',
                    color: '#ef5350',
                    borderTop: '1px solid rgba(255,255,255,0.06)',
                  }}
                >
                  {deduction}
                </td>
              </tr>
            ))}
          </tbody>
        </Box>
      </Section>

      <Section icon={<VerifiedIcon />} title="AI Sustainability Equivalents">
        <Typography variant="body2" paragraph>
          The AI impact module converts real water flow into meaningful sustainability
          equivalents using fixed, configurable constants:
        </Typography>
        <Typography variant="body2" component="div">
          <ul>
            <li>
              <strong>Water per kWh:</strong> 1.8 L/kWh — average water consumption for
              data center cooling (industry estimate, varies by facility)
            </li>
            <li>
              <strong>kWh per AI inference:</strong> 0.001 kWh — estimated energy per
              large-model inference request
            </li>
            <li>
              <strong>kWh per GPU training hour:</strong> 1.2 kWh — A100-class GPU at
              ~80% utilization
            </li>
          </ul>
        </Typography>
        <Alert severity="info" sx={{ mt: 1 }}>
          These constants are estimates based on published research and industry reports.
          Actual values vary significantly by data center, model size, and workload.
          All constants are configurable via environment variables.
        </Alert>
      </Section>
    </Box>
  );
}
