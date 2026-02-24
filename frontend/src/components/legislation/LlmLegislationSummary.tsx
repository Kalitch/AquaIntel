import React, { useState } from 'react';
import { Box, Button, CircularProgress, Chip, Typography } from '@mui/material';
import { apiClient } from '../../config/api';

export function LlmLegislationSummary() {
  const [loading, setLoading] = useState(false);
  const [text, setText] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const generate = async () => {
    setLoading(true);
    setError(null);
    setText(null);
    try {
      const res = await apiClient.get('/legislation/summary/llm');
      setText(res.data?.narrative ?? String(res.data));
      console.log(
        "LLM Summary Response:",
        res.data?.narrative ?? String(res.data),
      );
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to generate summary');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 2, bgcolor: 'background.paper', borderRadius: 1, mt: 2 }}>
      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 1 }}>
        <Chip label="LLM Summary" />
        <Button onClick={generate} variant="contained" size="small">
          Generate Summary
        </Button>
      </Box>

      {loading && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <CircularProgress size={20} />
          <Typography>Analyzing legislative landscape…</Typography>
        </Box>
      )}

      {error && <Typography color="error">{error}</Typography>}

      {text && <Typography sx={{ whiteSpace: 'pre-wrap' }}>{text}</Typography>}
    </Box>
  );
}
