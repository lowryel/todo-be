import 'dotenv/config';

function readPort(): number {
  const parsed = Number.parseInt(process.env['PORT'] ?? '3000', 10);
  return Number.isFinite(parsed) ? parsed : 3000;
}

function readDatabaseUrl(): string {
  const url = process.env['DATABASE_URL'];
  if (!url) {
    console.error(
      'DATABASE_URL is not set. Copy .env.example to .env and start PostgreSQL.',
    );
    process.exit(1);
  }
  return url;
}

export const env = {
  nodeEnv: process.env['NODE_ENV'] ?? 'development',
  port: readPort(),
  databaseUrl: readDatabaseUrl(),
  corsOrigins: (process.env['CORS_ORIGIN'] ?? 'http://localhost:4200,http://localhost:8080')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
} as const;
