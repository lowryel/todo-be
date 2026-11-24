import { app } from './app.ts';
import { env } from './env.ts';
import { prisma } from './lib/prisma.ts';

const server = app.listen(env.port, () => {
  console.log(`todo-be listening on http://localhost:${env.port} (${env.nodeEnv})`);
});

server.on('error', (error) => {
  console.error('HTTP server failed:', error);
  process.exit(1);
});

function shutdown(signal: NodeJS.Signals): void {
  console.log(`${signal} received, shutting down`);
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });

  setTimeout(() => process.exit(1), 10_000).unref();
}

process.once('SIGINT', () => shutdown('SIGINT'));
process.once('SIGTERM', () => shutdown('SIGTERM'));
