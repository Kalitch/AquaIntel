import React, { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Autocomplete,
  CircularProgress,
  Typography,
  Alert,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { useStations } from '../../hooks/useApi';
import { WaterStation } from '../../types/api.types';

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
    // If user re-submits the same state after an error or no-op,
    // briefly clear committedState to force the fetch effect in `useStations`.
    if (selectedState && committedState === selectedState) {
      setCommittedState(null);
      // small delay to ensure state change is observed
      setTimeout(() => setCommittedState(selectedState), 0);
    } else {
      setCommittedState(selectedState);
    }
  };

  const handleManualSearch = () => {
    if (manualId.trim()) {
      onSelect(manualId.trim(), `Station ${manualId.trim()}`);
    }
  };

  return (
    <Box>
      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
        Search by U.S. State
      </Typography>
      <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
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
          Search
        </Button>
      </Box>

      {error && <Alert severity="warning" sx={{ mb: 2 }}>{error}</Alert>}

      {stations.length > 0 && (
        <Autocomplete
          options={stations}
          getOptionLabel={(s: WaterStation) => `${s.id} — ${s.name}`}
          onChange={(_, station) => {
            if (station) onSelect(station.id, station.name);
          }}
          renderInput={(params) => (
            <TextField {...params} label="Select Station" size="small" fullWidth />
          )}
          sx={{ mb: 2 }}
          size="small"
        />
      )}

      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
        Or enter Station ID directly
      </Typography>
      <Box sx={{ display: 'flex', gap: 1 }}>
        <TextField
          value={manualId}
          onChange={(e) => setManualId(e.target.value)}
          placeholder="e.g. 01646500"
          size="small"
          label="USGS Station ID"
          sx={{ flex: 1 }}
          onKeyDown={(e) => e.key === 'Enter' && handleManualSearch()}
        />
        <Button
          variant="outlined"
          onClick={handleManualSearch}
          disabled={!manualId.trim()}
          size="small"
        >
          Load
        </Button>
      </Box>
    </Box>
  );
}
