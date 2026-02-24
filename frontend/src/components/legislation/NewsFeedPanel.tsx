import React, { useState } from 'react';
import {
  Box,
  Chip,
  Divider,
  Link,
  Stack,
  Tab,
  Tabs,
  Typography,
  Skeleton,
  Alert,
} from '@mui/material';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { useNews } from '../../hooks/useApi';
import { formatDate } from '../../utils/formatters';
import { NewsCategory } from '../../types/api.types';

const CATEGORY_COLORS: Record<NewsCategory, string> = {
  water: '#29b6f6',
  legislation: '#ce93d8',
  ai: '#80cbc4',
  drought: '#ffa726',
  general: '#90a4ae',
};

const CATEGORIES: Array<{ key: 'all' | NewsCategory; label: string }> = [
  { key: 'all', label: 'All' },
  { key: 'water', label: 'Water' },
  { key: 'legislation', label: 'Legislation' },
  { key: 'ai', label: 'AI' },
  { key: 'drought', label: 'Drought' },
];

export function NewsFeedPanel() {
  const [tab, setTab] = useState<'all' | NewsCategory>('all');
  const category = tab === 'all' ? undefined : tab;
  const { data, loading } = useNews(category);

  return (
    <Box sx={{ maxHeight: 600, overflowY: 'auto', pr: 1 }}>
      <Tabs
        value={tab}
        onChange={(_, v) => setTab(v as any)}
        variant="scrollable"
        scrollButtons
        sx={{ mb: 1 }}
      >
        {CATEGORIES.map((c) => (
          <Tab key={c.key} value={c.key} label={c.label} />
        ))}
      </Tabs>

      {loading && (
        <Stack spacing={2}>
          <Skeleton variant="rectangular" height={80} />
          <Skeleton variant="rectangular" height={80} />
          <Skeleton variant="rectangular" height={80} />
        </Stack>
      )}

      {!loading && data?.failedSources?.length ? (
        <Alert severity="warning" sx={{ mb: 1 }}>
          Some feeds failed: {data.failedSources.join(', ')}
        </Alert>
      ) : null}

      {!loading && (
        <Box>
          <Typography variant="caption" color="text.secondary">
            Last updated {data ? formatDate(data.fetchedAt) : '—'}
          </Typography>

          <Stack spacing={2} sx={{ mt: 1 }}>
            {data?.items.map((item) => (
              <Box key={item.link}>
                <Stack direction="row" justifyContent="space-between" spacing={1}>
                  <Box>
                    <Link href={item.link} target="_blank" rel="noopener noreferrer" underline="none">
                      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                        {item.title} <OpenInNewIcon sx={{ fontSize: 14, ml: 0.5 }} />
                      </Typography>
                    </Link>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.5 }}>
                      <Chip label={item.source} size="small" sx={{ bgcolor: 'transparent' }} />
                      <Chip label={item.category} size="small" sx={{ bgcolor: CATEGORY_COLORS[item.category] }} />
                      <Typography variant="caption" color="text.secondary">
                        {formatDate(item.pubDate)}
                      </Typography>
                    </Stack>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                      {item.description}
                    </Typography>
                  </Box>
                </Stack>
                <Divider sx={{ my: 1 }} />
              </Box>
            ))}
          </Stack>
        </Box>
      )}
    </Box>
  );
}
