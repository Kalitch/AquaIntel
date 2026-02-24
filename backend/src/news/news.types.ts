export interface RssItem {
  title: string;
  link: string;
  description: string;
  pubDate: string;
  source: string;
  category: NewsCategory;
}

export type NewsCategory = 'water' | 'legislation' | 'ai' | 'drought' | 'general';

export interface RssFeed {
  name: string;
  url: string;
  category: NewsCategory;
  enabled: boolean;
}

export interface NewsFeedResponse {
  items: RssItem[];
  fetchedAt: string;
  totalSources: number;
  failedSources: string[];
}
