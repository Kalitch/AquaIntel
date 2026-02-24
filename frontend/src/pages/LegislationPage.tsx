import React, { useState } from 'react';
import { Box, Grid, Typography, Alert } from '@mui/material';
import { NewsFeedPanel } from '../components/legislation/NewsFeedPanel';
import { LegislationStats } from '../components/legislation/LegislationStats';
import { BillCard } from '../components/legislation/BillCard';
import { LlmLegislationSummary } from '../components/legislation/LlmLegislationSummary';
import { useLegislation } from '../hooks/useApi';

export function LegislationPage() {
  const [aiOnly, setAiOnly] = useState(false);
  const { data, loading, error } = useLegislation(aiOnly);

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 1 }}>Water & AI Legislation Tracker</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Tracking real bills that affect water transparency, AI disclosure, and datacenter accountability across the U.S. and internationally.
      </Typography>

      <Alert severity="info" sx={{ mb: 2 }}>
        This tracker is manually curated and updated as bills advance. Data reflects publicly available legislative records.
      </Alert>

      <Grid container spacing={2}>
        <Grid item xs={12} md={7}>
          <NewsFeedPanel />
        </Grid>

        <Grid item xs={12} md={5}>
          {data && (
            <LegislationStats data={data} aiOnly={aiOnly} onAiOnlyChange={setAiOnly} />
          )}

          <Box sx={{ maxHeight: 420, overflowY: 'auto' }}>
            {data?.bills.map((b) => (
              <BillCard key={b.id} bill={b} />
            ))}
            {loading && <Typography>Loading bills…</Typography>}
            {error && <Typography color="error">{error}</Typography>}
          </Box>

          <LlmLegislationSummary />
        </Grid>
      </Grid>
    </Box>
  );
}
