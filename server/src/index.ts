import './bootstrap.js';
import { Server } from './server.js';
import { DEFAULT_PORT } from './constants.js';

let server: Server;

async function startApp() {
  server = new Server();
  const port = parseInt(process.env.RSS_WATCHER_PORT || DEFAULT_PORT.toString(), 10);
  await server.start(port);
}

async function shutdown(signal: string) {
  console.log(`\nReceived ${signal}, starting graceful shutdown...`);
  if (server) {
    await server.stop();
  }
  process.exit(0);
}

// Handle shutdown signals
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

startApp().catch(console.error); 