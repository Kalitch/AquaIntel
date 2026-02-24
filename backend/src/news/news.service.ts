import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { XMLParser } from 'fast-xml-parser';
import { RssItem, RssFeed, NewsFeedResponse, NewsCategory } from './news.types';

@Injectable()
export class NewsService {
  private readonly logger = new Logger(NewsService.name);
  private readonly parser = new XMLParser({ ignoreAttributes: false });
  private cache: { data: NewsFeedResponse; expiresAt: number } | null = null;
  private readonly cacheTtlMs = Number(
    process.env.NEWS_CACHE_TTL_MS ?? 3600000,
  );

  private readonly FEEDS: RssFeed[] = [
    {
      name: "EPA Newsroom",
      url: "https://19january2021snapshot.epa.gov/newsreleases/releases/rss/subject/water_.html",
      category: "water",
      enabled: true,
    },
    {
      name: "USGS Water News",
      url: "https://water.usgs.gov/alerts/project_alert.xml",
      category: "water",
      enabled: true,
    },
    {
      name: "US Drought Monitor",
      url: "https://droughtmonitor.unl.edu/Data/RssFeeds/Category/National.xml",
      category: "drought",
      enabled: true,
    },
    {
      name: "Environment & Energy News",
      url: "https://www.eenews.net/rss/1",
      category: "legislation",
      enabled: true,
    },
    {
      name: "NRDC News",
      url: "https://www.nrdc.org/rss.xml",
      category: "general",
      enabled: true,
    },
  ];

  async getNews(category?: NewsCategory): Promise<NewsFeedResponse> {
    if (this.cache && Date.now() < this.cache.expiresAt) {
      const cached = this.cache.data;
      if (category) {
        return {
          ...cached,
          items: cached.items.filter((i) => i.category === category),
        };
      }
      return cached;
    }

    const enabledFeeds = this.FEEDS.filter((f) => f.enabled);
    const failedSources: string[] = [];
    const allItems: RssItem[] = [];

    const results = await Promise.allSettled(
      enabledFeeds.map((feed) => this.fetchFeed(feed)),
    );

    results.forEach((result, i) => {
      if (result.status === "fulfilled") {
        allItems.push(...result.value);
      } else {
        failedSources.push(enabledFeeds[i].name);
        this.logger.warn(
          `Failed to fetch feed "${enabledFeeds[i].name}": ${result.reason}`,
        );
      }
    });

    const seen = new Set<string>();
    const deduped = allItems
      .filter((item) => {
        if (seen.has(item.link)) return false;
        seen.add(item.link);
        return true;
      })
      .sort(
        (a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime(),
      )
      .slice(0, 50);

    const response: NewsFeedResponse = {
      items: deduped,
      fetchedAt: new Date().toISOString(),
      totalSources: enabledFeeds.length,
      failedSources,
    };

    this.cache = { data: response, expiresAt: Date.now() + this.cacheTtlMs };

    if (category) {
      return {
        ...response,
        items: deduped.filter((i) => i.category === category),
      };
    }
    return response;
  }

  private async fetchFeed(feed: RssFeed): Promise<RssItem[]> {
    const response = await axios.get<string>(feed.url, {
      timeout: 8000,
      headers: { "User-Agent": "AquaIntel/1.0 (water intelligence platform)" },
      responseType: "text",
    });

    const parsed = this.parser.parse(response.data);
    const channel = (parsed as any)?.rss?.channel ?? (parsed as any)?.feed;
    if (!channel) return [];

    const rawItems = Array.isArray(channel.item)
      ? channel.item
      : Array.isArray(channel.entry)
        ? channel.entry
        : channel.item != null
          ? [channel.item]
          : channel.entry != null
            ? [channel.entry]
            : [];
    const itemArray = Array.isArray(rawItems) ? rawItems : [rawItems];

    return itemArray
      .slice(0, 15)
      .map((item: unknown) => this.normalizeItem(item, feed))
      .filter((item): item is RssItem => item !== null);
  }

  private normalizeItem(raw: unknown, feed: RssFeed): RssItem | null {
    try {
      const item = raw as Record<string, unknown>;

      const title = String(item["title"] ?? "Untitled")
        .replace(/<[^>]*>/g, "")
        .trim();

      const rawLink = item["link"];
      const link = String(
        rawLink !== null && rawLink !== undefined && typeof rawLink === "object"
          ? ((rawLink as unknown as Record<string, string>)["@_href"] ?? "")
          : (rawLink ?? ""),
      ).trim();

      const description = String(
        item["description"] ?? item["summary"] ?? item["content"] ?? "",
      )
        .replace(/<[^>]*>/g, "")
        .trim()
        .slice(0, 300);

      const pubDate = String(
        item["pubDate"] ??
          item["published"] ??
          item["updated"] ??
          new Date().toISOString(),
      );

      if (!title || !link) return null;

      return {
        title,
        link,
        description,
        pubDate,
        source: feed.name,
        category: feed.category,
      };
    } catch {
      return null;
    }
  }
}
