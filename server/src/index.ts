import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';
import { Server } from './server.js';

// Load environment variables from .env file in the project root
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '../..');
config({ path: path.join(rootDir, '.env') });

async function startApp() {
  const server = new Server();
  await server.start(3000);
}

startApp().catch(console.error); 