export type NtfyPriority = 'urgent' | 'high' | 'default' | 'low' | 'min';

export interface NotificationSettings {
  usePostTitle: boolean;
  customTitle?: string;
  usePostDescription: boolean;
  customDescription?: string;
  appendLink: boolean;
  priority: NtfyPriority;
  includeKeywordTags: boolean;
  includeOpenAction: boolean;
}

export interface FeedConfig {
  url: string;
  keywords: string[];
  notificationSettings: NotificationSettings;
} 