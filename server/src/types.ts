import Parser from 'rss-parser';
import { FeedConfig, NotificationSettings, NtfyPriority } from '../../shared/types.js';

export { FeedConfig, NotificationSettings, NtfyPriority };

export interface RssItemCustomFields {
  'dc:content'?: string;
  'content:encoded'?: string;
}

export interface RssItem extends Parser.Item {
  guid?: string;
  'dc:content'?: string;
  'content:encoded'?: string;
}

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

export interface FeedHistory {
  entries: FeedHistoryEntry[];
  maxEntries: number;
}

export interface FeedHistoryEntry extends FeedItem {
  feedUrl: string;
  checkedAt: string;
  notificationSent: boolean;
  matchedKeywords: string[];
}

export interface AppConfig {
  feeds: FeedConfig[];
  ntfyTopic: string;
  ntfyServerAddress: string;
  checkIntervalMinutes: number;
}

export interface PostHistory {
    [postGuid: string]: {
        feedUrl: string;
        checkedAt: string;  // ISO string timestamp
        title: string;
        link: string;
        matchedKeywords: string[];
        notificationSent: boolean;
    };
} 