export interface FeedConfig {
  url: string;
  keywords: string[];
}

export interface AppConfig {
  feeds: FeedConfig[];
  ntfyTopic: string;
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