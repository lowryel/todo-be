import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client.ts';
import { env } from '../env.ts';

// Prisma 7 is engine-free: PostgreSQL access goes through a driver adapter.
const adapter = new PrismaPg({ connectionString: env.databaseUrl });

export const prisma = new PrismaClient({
  adapter,
  log: env.nodeEnv === 'development' ? ['warn', 'error'] : ['error'],
});
