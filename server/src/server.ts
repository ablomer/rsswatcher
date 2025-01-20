import express from 'express';
import cors from 'cors';
import { ConfigManager } from './config.js';
import { FeedMonitor } from './feedMonitor.js';
import { AppConfig } from './types.js';
import path from 'path';
import { fileURLToPath } from 'url';
import { Socket } from 'net';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export class Server {
  private app: express.Application;
  private configManager: ConfigManager;
  private feedMonitor: FeedMonitor;
  private server?: ReturnType<typeof express.application.listen>;
  private connections: Set<Socket> = new Set();

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
      const { createServer: createViteServer } = await import('vite');
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: 'spa',
        root: path.resolve(__dirname, '../../client'),
      });

      this.app.use(vite.middlewares);
    } else {
      // In production, serve the built files from dist/client
      const clientDist = path.resolve(__dirname, '../client');
      this.app.use(express.static(clientDist));
      this.app.get('*', (_req, res) => {
        res.sendFile(path.resolve(clientDist, 'index.html'));
      });
    }
  }

  private setupRoutes() {
    // Get current configuration
    this.app.get('/api/config', (_req, res) => {
      try {
        const config = this.configManager.getConfig();
        res.json(config);
      } catch (error) {
        console.error('Failed to get configuration:', error);
        res.status(500).json({ error: 'Failed to get configuration' });
      }
    });

    // Get feed history
    this.app.get('/api/history', (_req, res) => {
      try {
        const history = {
          entries: this.feedMonitor.getPostHistoryEntries(),
          maxEntries: 1000
        };
        res.json(history);
      } catch (error) {
        console.error('Failed to get history:', error);
        res.status(500).json({ error: 'Failed to get history' });
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
    this.app.get('/api/status', (_req, res) => {
      try {
        const status = this.feedMonitor.getStatus();
        res.json(status);
      } catch (error) {
        console.error('Failed to get status:', error);
        res.status(500).json({ error: 'Failed to get status' });
      }
    });

    // Force check feeds
    this.app.post('/api/check', async (_req, res) => {
      try {
        await this.feedMonitor.checkFeeds();
        res.json({ success: true });
      } catch (error) {
        console.error('Failed to check feeds:', error);
        res.status(500).json({ error: 'Failed to check feeds' });
      }
    });

    // Send test notification
    this.app.post('/api/test-notification', async (_req, res) => {
      try {
        await this.feedMonitor.sendTestNotification();
        res.json({ success: true });
      } catch (error) {
        console.error('Failed to send test notification:', error);
        res.status(500).json({ error: 'Failed to send test notification' });
      }
    });
  }

  public async start(port: number = 3000) {
    await this.setupVite();
    this.server = this.app.listen(port, () => {
      console.log(`
╔═══════════════════════════════════════════╗
║                RSS Watcher                ║
╚═══════════════════════════════════════════╝
🚀 Server is running on port ${port}
📡 Mode: ${process.env.NODE_ENV || 'production'}

Monitoring your feeds! 📰
`);
    });

    // Track all connections
    this.server.on('connection', (conn) => {
      this.connections.add(conn);
      conn.on('close', () => this.connections.delete(conn));
    });
  }

  public async stop() {
    console.log('Stopping feed monitor...');
    this.feedMonitor.stop();
    
    if (this.server) {
      console.log('Closing HTTP server...');
      for (const conn of this.connections) {
        conn.destroy();
      }

      return new Promise<void>((resolve, reject) => {
        this.server!.close((err) => {
          if (err) {
            console.error('Error while closing HTTP server:', err);
            reject(err);
          } else {
            resolve();
          }
        });
      });
    }
  }
} 