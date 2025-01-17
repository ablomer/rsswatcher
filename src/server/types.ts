import Parser from 'rss-parser';

export interface FeedConfig {
  url: string;
  keywords: string[];
}

export interface AppConfig {
  feeds: FeedConfig[];
  ntfyTopic: string;
  ntfyServerAddress: string;
  checkIntervalMinutes: number;
}

export interface RssItemCustomFields {
  dcContent?: string;
  'content:encoded'?: string;
  'dc:content'?: string;
}

export interface RssItem extends Parser.Item, RssItemCustomFields {}

export interface FeedItem {
  title: string;
  link: string;
  description: string;
  content: string;
  summary: string;
  contentSnippet: string;
  pubDate: string;
}

export interface FeedStatus {
  lastCheck: string;
  isChecking: boolean;
  error?: string;
}

export interface FeedHistoryEntry extends FeedItem {
  feedUrl: string;
  checkedAt: string;
  notificationSent: boolean;
  matchedKeywords: string[];
}

export interface FeedHistory {
  entries: FeedHistoryEntry[];
  maxEntries: number;
}

export interface PostHistory {
    [postGuid: string]: {
        feedUrl: string;
        checkedAt: string;  // ISO string timestamp
        title: string;
    };
} 