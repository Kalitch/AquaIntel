import React, { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Autocomplete,
  CircularProgress,
  Typography,
  Alert,
  LinearProgress,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useStations } from '../hooks/useApi';
import { WaterStation } from '../types/api.types';

const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA',
  'HI','ID','IL','IN','IA','KS','KY','LA','ME','MD',
  'MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
  'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC',
  'SD','TN','TX','UT','VT','VA','WA','WV','WI','WY',
];

interface StationSearchProps {
  onSelect: (stationId: string, stationName: string) => void;
}

export function StationSearch({ onSelect }: StationSearchProps) {
  const [selectedState, setSelectedState] = useState<string | null>(null);
  const [committedState, setCommittedState] = useState<string | null>(null);
  const [manualId, setManualId] = useState('');

  const { stations, loading, error } = useStations(committedState);

  const handleStateSearch = () => {
    setCommittedState(selectedState);
  };

  const handleManualSearch = () => {
    const id = manualId.trim().replace(/^USGS-/i, '');
    if (id) onSelect(id, `Station ${id}`);
  };

  return (
    <Box>
      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
        Search by U.S. State
      </Typography>
      <Box sx={{ display: 'flex', gap: 1, mb: 1, flexWrap: 'wrap', alignItems: 'center' }}>
        <Autocomplete
          options={US_STATES}
          value={selectedState}
          onChange={(_, v) => setSelectedState(v)}
          renderInput={(params) => (
            <TextField {...params} label="State" size="small" sx={{ width: 140 }} />
          )}
          size="small"
        />
        <Button
          variant="contained"
          onClick={handleStateSearch}
          disabled={!selectedState || loading}
          startIcon={loading ? <CircularProgress size={16} /> : <SearchIcon />}
          size="small"
        >
          {loading ? 'Verifying…' : 'Search'}
        </Button>
      </Box>

      {/* Progress indicator while verifying stations */}
      {loading && (
        <Box sx={{ mb: 2 }}>
          <LinearProgress sx={{ mb: 0.5 }} />
          <Typography variant="caption" color="text.secondary">
            Checking which stations have live streamflow data — this takes ~10s…
          </Typography>
        </Box>
      )}

      {error && <Alert severity="warning" sx={{ mb: 2 }}>{error}</Alert>}

      {!loading && stations.length > 0 && committedState && (
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <CheckCircleIcon sx={{ fontSize: 14, color: 'success.main' }} />
            <Typography variant="caption" color="success.main">
              {stations.length} stations with live data found in {committedState}
            </Typography>
          </Box>
          <Autocomplete
            options={stations}
            getOptionLabel={(s: WaterStation) => `${s.id} — ${s.name}`}
            onChange={(_, station) => {
              if (station) onSelect(station.id, station.name);
            }}
            renderInput={(params) => (
              <TextField {...params} label="Select Station" size="small" fullWidth />
            )}
            size="small"
          />
        </Box>
      )}

      {!loading && committedState && stations.length === 0 && !error && (
        <Alert severity="info" sx={{ mb: 2 }}>
          No stations with active streamflow data found in {committedState}. Try a neighboring state.
        </Alert>
      )}

      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
        Or enter a USGS Station ID directly
      </Typography>
      <Box sx={{ display: 'flex', gap: 1 }}>
        <TextField
          value={manualId}
          onChange={(e) => setManualId(e.target.value)}
          placeholder="e.g. 01646500"
          size="small"
          label="USGS Station ID"
          helperText="8-digit numeric ID from waterdata.usgs.gov"
          sx={{ flex: 1 }}
          onKeyDown={(e) => e.key === 'Enter' && handleManualSearch()}
        />
        <Button
          variant="outlined"
          onClick={handleManualSearch}
          disabled={!manualId.trim()}
          size="small"
          sx={{ mb: 3 }}
        >
          Load
        </Button>
      </Box>
    </Box>
  );
}
