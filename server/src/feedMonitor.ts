import Parser from 'rss-parser';
import cron from 'node-cron';
import fetch from 'node-fetch';
import { FeedItem, FeedStatus, FeedHistory, FeedHistoryEntry, RssItemCustomFields, RssItem, FeedConfig } from './types.js';
import { ConfigManager } from './config.js';
import { PostHistoryManager } from './postHistory.js';

export class FeedMonitor {
  private parser: Parser<object, RssItemCustomFields>;
  private configManager: ConfigManager;
  private cronJob?: cron.ScheduledTask;
  private status: Record<string, FeedStatus> = {};
  private history: FeedHistory = {
    entries: [],
    maxEntries: 1000 // Store up to 1000 entries
  };
  private postHistoryManager: PostHistoryManager;

  constructor(configManager: ConfigManager) {
    this.parser = new Parser<object, RssItemCustomFields>({
      customFields: {
        item: [
          ['dc:content', 'dc:content'],
          ['content:encoded', 'content:encoded']
        ]
      }
    });
    this.configManager = configManager;
    this.postHistoryManager = new PostHistoryManager();
    
    // Initialize status for configured feeds
    const config = this.configManager.getConfig();
    config.feeds.forEach((feed: FeedConfig) => {
      this.status[feed.url] = {
        lastCheck: new Date(0).toISOString(),
        isChecking: false,
        error: undefined
      };
    });
    
    this.setupCronJob();
  }

  private setupCronJob() {
    const config = this.configManager.getConfig();
    if (this.cronJob) {
      this.cronJob.stop();
    }

    // Ensure we have a valid check interval
    const checkInterval = Math.max(1, config.checkIntervalMinutes || 15);

    // Convert minutes to cron expression
    const cronExpression = `*/${checkInterval} * * * *`;
    this.cronJob = cron.schedule(cronExpression, () => {
      this.checkFeeds().catch(console.error);
    });
  }

  private async checkFeed(url: string, keywords: string[]): Promise<void> {
    const config = this.configManager.getConfig();
    const feedConfig = config.feeds.find(f => f.url === url);
    if (!feedConfig) return;

    this.status[url] = {
      lastCheck: new Date().toISOString(),
      isChecking: true
    };

    try {
      const feed = await this.parser.parseURL(url);
      const newItems = feed.items.filter((item: RssItem) => {
        // Skip already checked posts
        if (item.guid && this.postHistoryManager.isPostChecked(item.guid)) {
          return false;
        }
        
        const text = `${item.title || ''} ${item['dc:content'] || ''} ${item.content || ''} ${item.summary || ''} ${item.contentSnippet || ''} ${item['content:encoded'] || ''}`.toLowerCase();
        return keywords.some(keyword => 
          text.includes(keyword.toLowerCase())
        );
      });

      const matchingItems = newItems.map((item: RssItem) => ({
        title: (item.title || '').trim(),
        link: item.link || '',
        description: item['dc:content'] || item['content:encoded'] || item.content || item.summary || item.contentSnippet || '',
        content: item['dc:content'] || item['content:encoded'] || item.content || '',
        summary: item.summary || '',
        contentSnippet: item.contentSnippet || '',
        pubDate: item.pubDate || ''
      }));

      const checkedAt = new Date().toISOString();
      for (const item of matchingItems) {
        const matchedKeywords = keywords.filter(keyword =>
          `${item.title} ${item.content}`.toLowerCase().includes(keyword.toLowerCase())
        );
        
        // Add to history before sending notification
        const historyEntry: FeedHistoryEntry = {
          ...item,
          feedUrl: url,
          checkedAt,
          notificationSent: false,
          matchedKeywords
        };
        
        await this.sendNotification(item, matchedKeywords, feedConfig);
        
        // Update history entry to reflect sent notification
        historyEntry.notificationSent = true;
        this.addToHistory(historyEntry);
      }

      // Track all items in post history
      feed.items.forEach((item: RssItem) => {
        if (item.guid && !this.postHistoryManager.isPostChecked(item.guid)) {
          const text = `${item.title || ''} ${item['dc:content'] || ''} ${item.content || ''} ${item.summary || ''} ${item.contentSnippet || ''} ${item['content:encoded'] || ''}`.toLowerCase();
          const matchedKeywords = keywords.filter(keyword => 
            text.includes(keyword.toLowerCase())
          );
          this.postHistoryManager.addCheckedPost(
            item.guid,
            url,
            (item.title || '').trim(),
            item.link || '',
            matchedKeywords,
            matchedKeywords.length > 0  // notification sent if keywords matched
          );
        }
      });

      this.status[url] = {
        lastCheck: checkedAt,
        isChecking: false
      };
    } catch (error) {
      this.status[url] = {
        lastCheck: new Date().toISOString(),
        isChecking: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
      console.error(`Error checking feed ${url}:`, error);
    }
  }

  private addToHistory(entry: FeedHistoryEntry) {
    this.history.entries.unshift(entry);
    if (this.history.entries.length > this.history.maxEntries) {
      this.history.entries.pop();
    }
  }

  private async sendNotification(item: FeedItem, matchedKeywords: string[], feedConfig: FeedConfig) {
    const config = this.configManager.getConfig();
    const ntfyUrl = `${config.ntfyServerAddress}/${config.ntfyTopic}`;
    const settings = feedConfig.notificationSettings;
    
    // Determine title
    const title = settings.usePostTitle ? item.title : (settings.customTitle || item.title);
    const sanitizedTitle = title.replace(/[^\x20-\x7E]/g, '');
    
    // Determine description
    let description = settings.usePostDescription ? item.description : (settings.customDescription || item.description);
    if (settings.appendLink && item.link) {
      description = `${description}\n\nLink: ${item.link}`;
    }
    
    try {
      console.log(`🔔 Sending notification: "${sanitizedTitle}" to ${ntfyUrl}`);
      const headers: Record<string, string> = {
        'Title': sanitizedTitle,
        'Priority': settings.priority,
      };

      // Add tags if enabled
      if (settings.includeKeywordTags && matchedKeywords.length > 0) {
        headers['Tags'] = matchedKeywords.join(',');
      }

      // Add Open action if enabled
      if (settings.includeOpenAction && item.link) {
        headers['Actions'] = `view, Open, ${item.link}`;
      }

      await fetch(ntfyUrl, {
        method: 'POST',
        body: description,
        headers,
      });
    } catch (error) {
      console.error(`❌ Failed to send "${sanitizedTitle}"\n  → Error: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  public async checkFeeds(): Promise<void> {
    const config = this.configManager.getConfig();
    const checkPromises = config.feeds.map((feed: FeedConfig) => 
      this.checkFeed(feed.url, feed.keywords)
    );
    await Promise.all(checkPromises);
  }

  public getStatus(): Record<string, FeedStatus> {
    return { ...this.status };
  }

  public updateConfig() {
    this.setupCronJob();
    
    // Get current config and URLs
    const config = this.configManager.getConfig();
    const configuredUrls = new Set(config.feeds.map((feed: FeedConfig) => feed.url));
    
    // Remove status entries for feeds that are no longer in the config
    Object.keys(this.status).forEach(url => {
      if (!configuredUrls.has(url)) {
        delete this.status[url];
      }
    });
    
    // Initialize status entries for all configured feeds
    config.feeds.forEach((feed: FeedConfig) => {
      if (!this.status[feed.url]) {
        this.status[feed.url] = {
          lastCheck: new Date(0).toISOString(),
          isChecking: false,
          error: undefined
        };
      }
    });
  }

  public stop() {
    if (this.cronJob) {
      this.cronJob.stop();
    }
  }

  public getHistory(): FeedHistory {
    return { ...this.history };
  }

  public getPostHistoryEntries(): FeedHistoryEntry[] {
    return this.postHistoryManager.getPostHistoryEntries();
  }

  public async sendTestNotification(): Promise<void> {
    const config = this.configManager.getConfig();
    const testItem: FeedItem = {
      title: "Test Notification",
      description: "This is a test notification from your RSS Feed Monitor",
      content: "This is a test notification from your RSS Feed Monitor",
      summary: "This is a test notification from your RSS Feed Monitor",
      contentSnippet: "This is a test notification from your RSS Feed Monitor",
      link: config.ntfyServerAddress,
      pubDate: new Date().toISOString()
    };

    const testFeedConfig: FeedConfig = {
      url: "test",
      keywords: ["test"],
      notificationSettings: {
        usePostTitle: true,
        usePostDescription: true,
        appendLink: true,
        priority: 'default',
        includeKeywordTags: true,
        includeOpenAction: true,
      }
    };

    await this.sendNotification(testItem, ["test"], testFeedConfig);
  }
} 