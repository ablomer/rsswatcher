import express from 'express';
import cors from 'cors';
import { ConfigManager } from './config';
import { FeedMonitor } from './feedMonitor';
import { AppConfig } from './types';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export class Server {
  private app: express.Application;
  private configManager: ConfigManager;
  private feedMonitor: FeedMonitor;

  constructor() {
    this.app = express();
    this.configManager = new ConfigManager();
    this.feedMonitor = new FeedMonitor(this.configManager);
    this.setupMiddleware();
    this.setupRoutes();
  }

  private setupMiddleware() {
    this.app.use(express.json());
    this.app.use(cors());
  }

  private async setupVite() {
    if (process.env.NODE_ENV === 'development') {
      // In development, integrate Vite's dev middleware
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: 'spa',
        root: path.resolve(__dirname, '..'),
        publicDir: path.resolve(__dirname, '../../public'),
      });

      this.app.use(vite.middlewares);
    } else {
      // In production, serve the built files
      this.app.use(express.static(path.resolve(__dirname, '../../../dist')));
      this.app.get('*', (req, res) => {
        res.sendFile(path.resolve(__dirname, '../../../dist/index.html'));
      });
    }
  }

  private setupRoutes() {
    // Get current configuration
    this.app.get('/api/config', (req, res) => {
      try {
        const config = this.configManager.getConfig();
        res.json(config);
      } catch (error) {
        console.error('Failed to get configuration:', error);
        res.status(500).json({ error: 'Failed to get configuration' });
      }
    });

    // Update configuration
    this.app.post('/api/config', async (req, res) => {
      try {
        const newConfig: AppConfig = req.body;
        await this.configManager.updateConfig(newConfig);
        this.feedMonitor.updateConfig();
        res.json({ success: true });
      } catch (error) {
        console.error('Failed to update configuration:', error);
        res.status(500).json({ error: 'Failed to update configuration' });
      }
    });

    // Get feed status
    this.app.get('/api/status', (req, res) => {
      try {
        const status = this.feedMonitor.getStatus();
        res.json(status);
      } catch (error) {
        console.error('Failed to get status:', error);
        res.status(500).json({ error: 'Failed to get status' });
      }
    });

    // Force check feeds
    this.app.post('/api/check', async (req, res) => {
      try {
        await this.feedMonitor.checkFeeds();
        res.json({ success: true });
      } catch (error) {
        console.error('Failed to check feeds:', error);
        res.status(500).json({ error: 'Failed to check feeds' });
      }
    });
  }

  public async start(port: number = 3000) {
    await this.setupVite();
    this.app.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });
  }

  public stop() {
    this.feedMonitor.stop();
  }
} 