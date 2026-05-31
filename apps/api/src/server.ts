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

server.listen(env.PORT, env.HOST, () => {
  console.log(`Oman Sale API running on ${env.API_URL} (host ${env.HOST}:${env.PORT})`);
});

const shutdown = async () => {
  await prisma.$disconnect();
  server.close(() => process.exit(0));
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
