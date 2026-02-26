import React from 'react';
import Alert from '@mui/material/Alert';
import AlertTitle from '@mui/material/AlertTitle';
import { StationStatus } from '../../types/api.types';

interface Props {
  stationStatus: StationStatus | null | undefined;
}

export function StationStatusBanner({ stationStatus }: Props) {
  // Don't render anything if station is active or no status provided
  if (!stationStatus || stationStatus.active) return null;
  // Don't render if there's no message
  if (!stationStatus.message) return null;

  return (
    <Alert
      severity="warning"
      sx={{ mb: 2, borderRadius: 2 }}
    >
      <AlertTitle>Inactive Station</AlertTitle>
      {stationStatus.message}
    </Alert>
  );
}
