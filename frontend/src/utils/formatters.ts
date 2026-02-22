export function formatNumber(n: number, decimals = 1): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(decimals)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(decimals)}K`;
  return n.toFixed(decimals);
}

export function formatDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

export function scoreToColor(score: number): string {
  if (score >= 80) return '#66bb6a';
  if (score >= 60) return '#ffa726';
  if (score >= 40) return '#ff7043';
  return '#ef5350';
}

export function scoreToLabel(score: number): string {
  if (score >= 80) return 'Excellent';
  if (score >= 60) return 'Moderate';
  if (score >= 40) return 'Concerning';
  return 'Critical';
}

export function severityToColor(severity: string): 'success' | 'warning' | 'error' | 'default' {
  if (severity === 'severe') return 'error';
  if (severity === 'moderate') return 'warning';
  if (severity === 'none') return 'success';
  return 'default';
}
