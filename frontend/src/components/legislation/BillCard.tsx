import React, { useState } from 'react';
import {
  Box,
  Button,
  Chip,
  Stack,
  Typography,
} from '@mui/material';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { WaterBill } from '../../types/api.types';
import { formatDate } from '../../utils/formatters';

const STATUS_COLORS: Record<string, string> = {
  introduced: '#29b6f6',
  committee: '#ffa726',
  passed_chamber: '#26c6da',
  signed: '#66bb6a',
  vetoed: '#ef5350',
  failed: '#90a4ae',
  monitoring: '#ce93d8',
};

export function BillCard({ bill }: { bill: WaterBill }) {
  const [open, setOpen] = useState(false);

  return (
    <Box sx={{ borderRadius: 1, p: 2, bgcolor: 'background.paper', mb: 1 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Stack>
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            {bill.shortTitle}
          </Typography>
          <Stack direction="row" spacing={1} sx={{ mt: 0.5 }} alignItems="center">
            <Chip label={bill.scope === 'federal' ? 'Federal' : bill.scope} size="small" />
            <Chip label={bill.status} size="small" sx={{ bgcolor: STATUS_COLORS[bill.status] }} />
            {bill.aiRelated && <Chip label="AI-Related" size="small" color="secondary" />}
          </Stack>
        </Stack>

        <Box>
          <Button
            size="small"
            variant="outlined"
            endIcon={<OpenInNewIcon />}
            href={bill.url}
            target="_blank"
            rel="noopener noreferrer"
          >
            View Bill
          </Button>
        </Box>
      </Stack>

      {bill.sponsor ? (
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
          Sponsor: {bill.sponsor}
        </Typography>
      ) : null}

      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
        Last action: {formatDate(bill.date)}
      </Typography>

      <Typography variant="body2" sx={{ mt: 1, display: '-webkit-box', WebkitLineClamp: open ? 'none' : 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
        {bill.summary}
      </Typography>

      <Stack direction="row" spacing={1} sx={{ mt: 1, alignItems: 'center' }}>
        {bill.tags.map((t) => (
          <Chip key={t} label={t} size="small" />
        ))}

        <Button size="small" onClick={() => setOpen(!open)}>
          {open ? 'Show less' : 'Show more'}
        </Button>
      </Stack>
    </Box>
  );
}
