import './bootstrap.js';
import { Server } from './server.js';

let server: Server;

async function startApp() {
  server = new Server();
  await server.start(3000);
}

async function shutdown(signal: string) {
  console.log(`\nReceived ${signal}, starting graceful shutdown...`);
  if (server) {
    await server.stop();
    console.log('Server stopped successfully');
  }
  process.exit(0);
}

// Handle shutdown signals
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

startApp().catch(console.error); 