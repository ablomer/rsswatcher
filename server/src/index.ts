import { config } from 'dotenv';
import { Server } from './server.js';

config();

async function startApp() {
  const server = new Server();
  await server.start(3000);
}

startApp().catch(console.error); 