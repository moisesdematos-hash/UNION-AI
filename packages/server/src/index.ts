import { closeOperationalDatabase } from './db/operational-database.js';
import { createApp } from './app.js';
import { env } from './config/env.js';

const app = createApp();

const server = app.listen(env.PORT, () => {
  console.log(`[UNION.AI Server] running on http://localhost:${env.PORT}`);
});

process.on('SIGTERM', () => {
  console.log('[UNION.AI Server] SIGTERM received. Graceful shutdown...');
  server.close(async () => {
    await closeOperationalDatabase();
    process.exit(0);
  });
});
