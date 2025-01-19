import fs from 'fs';
import path from 'path';
import { AppConfig } from './types';
import { DEFAULT_DATA_DIR } from './constants';

const DATA_DIR = process.env.RSS_WATCHER_DATA_DIR || DEFAULT_DATA_DIR;
const CONFIG_FILE = path.join(DATA_DIR, 'config.json');

const DEFAULT_CONFIG: AppConfig = {
  feeds: [],
  ntfyTopic: '',
  ntfyServerAddress: 'https://ntfy.sh',
  checkIntervalMinutes: 15
};

export class ConfigManager {
  private config: AppConfig;

  constructor() {
    // Ensure data directory exists
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    this.config = this.loadConfig();
  }

  private loadConfig(): AppConfig {
    try {
      if (fs.existsSync(CONFIG_FILE)) {
        const data = fs.readFileSync(CONFIG_FILE, 'utf8');
        return JSON.parse(data);
      }
      return DEFAULT_CONFIG;
    } catch (error) {
      console.error('Error loading config:', error);
      return DEFAULT_CONFIG;
    }
  }

  public getConfig(): AppConfig {
    return { ...this.config };
  }

  public async updateConfig(newConfig: AppConfig): Promise<void> {
    this.config = newConfig;
    try {
      await fs.promises.writeFile(CONFIG_FILE, JSON.stringify(newConfig, null, 2));
    } catch (error) {
      console.error('Error saving config:', error);
      throw new Error('Failed to save configuration');
    }
  }
} 