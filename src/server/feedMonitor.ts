import Parser from 'rss-parser';
import cron from 'node-cron';
import fetch from 'node-fetch';
import { FeedItem, FeedStatus, FeedHistory, FeedHistoryEntry, RssItemCustomFields, RssItem } from './types';
import { ConfigManager } from './config';
import { PostHistoryManager } from './postHistory';

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
    config.feeds.forEach(feed => {
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
        title: item.title || '',
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
        
        await this.sendNotification(item);
        
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
            item.title || '',
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

  private async sendNotification(item: FeedItem) {
    const config = this.configManager.getConfig();
    const ntfyUrl = `${config.ntfyServerAddress}/${config.ntfyTopic}`;
    
    try {
      console.log(`Sending notification for ${item.title}`);
      await fetch(ntfyUrl, {
        method: 'POST',
        body: item.description,
        headers: {
          'Title': item.title,
          'Priority': 'low'
        }
      });
    } catch (error) {
      console.error(`Error sending notification for ${item.title}:`, error);
    }
  }

  public async checkFeeds(): Promise<void> {
    const config = this.configManager.getConfig();
    const checkPromises = config.feeds.map(feed => 
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
    const configuredUrls = new Set(config.feeds.map(feed => feed.url));
    
    // Remove status entries for feeds that are no longer in the config
    Object.keys(this.status).forEach(url => {
      if (!configuredUrls.has(url)) {
        delete this.status[url];
      }
    });
    
    // Initialize status entries for all configured feeds
    config.feeds.forEach(feed => {
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
    return this.postHistoryManager.getHistoryEntries();
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
    await this.sendNotification(testItem);
  }
} 