import http from 'node:http';

import { app } from './app';
import { env } from './config/env';
import { createSocketServer } from './config/socket';
import { registerScheduledJobs } from './jobs/scheduler';
import { prisma } from './shared/prisma/client';

const server = http.createServer(app);
createSocketServer(server);

void registerScheduledJobs().catch((error) => {
  console.error('[scheduler] failed to register jobs', error);
});

// Start the queue workers in-process unless explicitly disabled. This keeps the
// dev experience to a single command while still allowing a dedicated worker
// process in production (set WORKERS_INLINE=false on the API there).
const runInlineWorkers = env.WORKERS_INLINE ?? env.NODE_ENV !== 'production';
if (runInlineWorkers) {
  void import('./workers')
    .then(({ workers }) => {
      console.log(`Started ${workers.length} inline Oman Sale queue workers`);
    })
    .catch((error) => {
      console.error('[workers] failed to start inline workers', error);
    });
}

server.listen(env.PORT, env.HOST, () => {
  console.log(`Oman Sale API running on ${env.API_URL} (host ${env.HOST}:${env.PORT})`);
});

const shutdown = async () => {
  await prisma.$disconnect();
  server.close(() => process.exit(0));
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
