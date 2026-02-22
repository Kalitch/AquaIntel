import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  LinearProgress,
  Divider,
  Alert,
} from '@mui/material';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import { IntelligenceAnalytics } from '../../types/api.types';
import { scoreToColor, scoreToLabel, formatNumber } from '../../utils/formatters';

interface IntelligencePanelProps {
  analytics: IntelligenceAnalytics;
  stationId: string;
}

export function IntelligencePanel({ analytics, stationId }: IntelligencePanelProps) {
  const { anomaly, sustainabilityScore, movingAverage7, movingAverage30, volatilityIndex } =
    analytics;

  const scoreColor = scoreToColor(sustainabilityScore);
  const scoreLabel = scoreToLabel(sustainabilityScore);

  const anomalyIcon =
    anomaly.severity === 'severe' ? (
      <ErrorOutlineIcon color="error" />
    ) : anomaly.severity === 'moderate' ? (
      <WarningAmberIcon color="warning" />
    ) : (
      <CheckCircleOutlineIcon color="success" />
    );

  const anomalyAlertSeverity =
    anomaly.severity === 'severe'
      ? 'error'
      : anomaly.severity === 'moderate'
      ? 'warning'
      : 'success';

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {/* Anomaly status */}
      <Alert severity={anomalyAlertSeverity} icon={anomalyIcon}>
        <Typography variant="body2" fontWeight={600}>
          {anomaly.detected ? `Anomaly Detected — ${anomaly.severity.toUpperCase()}` : 'Normal Conditions'}
        </Typography>
        <Typography variant="caption">{anomaly.message}</Typography>
      </Alert>

      {/* Moving averages */}
      <Card>
        <CardContent>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Moving Averages
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
            <Box>
              <Typography variant="h6" color="primary">
                {movingAverage7 !== null ? formatNumber(movingAverage7, 2) : '—'}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                7-Day MA
              </Typography>
            </Box>
            <Box>
              <Typography variant="h6" color="secondary">
                {movingAverage30 !== null ? formatNumber(movingAverage30, 2) : '—'}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                30-Day MA
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Volatility index */}
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="subtitle2" color="text.secondary">
              Volatility Index
            </Typography>
            <Typography variant="body2" fontWeight={700}>
              {volatilityIndex !== null ? volatilityIndex.toFixed(3) : '—'}
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={volatilityIndex !== null ? Math.min(volatilityIndex * 50, 100) : 0}
            sx={{
              height: 8,
              borderRadius: 4,
              bgcolor: 'rgba(255,255,255,0.08)',
              '& .MuiLinearProgress-bar': {
                bgcolor:
                  volatilityIndex !== null && volatilityIndex > 0.5 ? '#ffa726' : '#29b6f6',
              },
            }}
          />
          <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
            Coefficient of variation (stdDev / mean). &gt;0.5 = high volatility.
          </Typography>
        </CardContent>
      </Card>

      {/* Sustainability score */}
      <Card>
        <CardContent>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Sustainability Score
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
            <Typography variant="h3" fontWeight={800} sx={{ color: scoreColor }}>
              {sustainabilityScore}
            </Typography>
            <Box>
              <Chip
                label={scoreLabel}
                size="small"
                sx={{ bgcolor: `${scoreColor}22`, color: scoreColor, fontWeight: 700, mb: 0.5 }}
              />
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                Station {stationId}
              </Typography>
            </Box>
          </Box>
          <LinearProgress
            variant="determinate"
            value={sustainabilityScore}
            sx={{
              height: 8,
              borderRadius: 4,
              bgcolor: 'rgba(255,255,255,0.08)',
              '& .MuiLinearProgress-bar': { bgcolor: scoreColor },
            }}
          />
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            Composite score (0–100) based on volatility, anomaly status, and flow percentile.
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}
