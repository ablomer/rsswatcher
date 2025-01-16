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

export interface FeedItem {
  title: string;
  link: string;
  description: string;
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