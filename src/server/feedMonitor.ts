import Parser from 'rss-parser';
import cron from 'node-cron';
import fetch from 'node-fetch';
import { FeedItem, FeedStatus } from './types';
import { ConfigManager } from './config';

export class FeedMonitor {
  private parser: Parser;
  private configManager: ConfigManager;
  private cronJob?: cron.ScheduledTask;
  private status: Record<string, FeedStatus> = {};

  constructor(configManager: ConfigManager) {
    this.parser = new Parser();
    this.configManager = configManager;
    this.setupCronJob();
  }

  private setupCronJob() {
    const config = this.configManager.getConfig();
    if (this.cronJob) {
      this.cronJob.stop();
    }

    // Convert minutes to cron expression
    const cronExpression = `*/${config.checkIntervalMinutes} * * * *`;
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
      const matchingItems = feed.items
        .filter(item => {
          const text = `${item.title} ${item.contentSnippet}`.toLowerCase();
          return keywords.some(keyword => 
            text.includes(keyword.toLowerCase())
          );
        })
        .map(item => ({
          title: item.title || '',
          link: item.link || '',
          description: item.contentSnippet || '',
          pubDate: item.pubDate || ''
        }));

      for (const item of matchingItems) {
        await this.sendNotification(item);
      }

      this.status[url] = {
        lastCheck: new Date().toISOString(),
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

  private async sendNotification(item: FeedItem) {
    const config = this.configManager.getConfig();
    const ntfyUrl = `https://ntfy.local/${config.ntfyTopic}`;
    
    try {
      const body = {
        topic: config.ntfyTopic,
        title: item.title,
        message: item.description,
        click: item.link
      }
      console.log("Sending notification", body);
      await fetch(ntfyUrl, {
        method: 'POST',
        body: JSON.stringify(body),
        headers: {
          'Content-Type': 'application/json'
        }
      });
    } catch (error) {
      console.error('Error sending notification:', error);
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
    const currentUrls = new Set(config.feeds.map(feed => feed.url));
    
    // Clean up status for deleted feeds
    Object.keys(this.status).forEach(url => {
      if (!currentUrls.has(url)) {
        delete this.status[url];
      }
    });

    // Initialize status for new feeds and check them immediately
    config.feeds.forEach(feed => {
      if (!this.status[feed.url]) {
        this.status[feed.url] = {
          lastCheck: new Date(0).toISOString(), // Set to epoch to indicate never checked
          isChecking: false
        };
      }
    });

    // Trigger an immediate check of all feeds
    this.checkFeeds().catch(console.error);
  }

  public stop() {
    if (this.cronJob) {
      this.cronJob.stop();
    }
  }
} 