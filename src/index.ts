import { Server } from './server/server';

async function startApp() {
  const server = new Server();
  await server.start(3000);
}

startApp().catch(console.error); 