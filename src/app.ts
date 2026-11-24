import cors from 'cors';
import express, { type ErrorRequestHandler } from 'express';
import helmet from 'helmet';
import { ZodError } from 'zod';
import { env } from './env.ts';
import { prisma } from './lib/prisma.ts';
import { todosRouter } from './routes/todos.ts';

export const app = express();

app.disable('x-powered-by');
app.use(helmet());
app.use(
  cors({
    origin: env.corsOrigins.includes('*') ? '*' : env.corsOrigins,
  }),
);
app.use(express.json({ limit: '16kb' }));

app.use((req, res, next) => {
  const startedAt = performance.now();
  res.on('finish', () => {
    const duration = (performance.now() - startedAt).toFixed(1);
    console.log(`${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`);
  });
  next();
});

app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'todo-be',
    uptime: Math.round(process.uptime()),
  });
});

app.get('/ready', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ready', database: 'connected' });
  } catch {
    res.status(503).json({ status: 'unavailable', database: 'disconnected' });
  }
});

app.use('/api/todos', todosRouter);

app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof ZodError) {
    res.status(400).json({
      error: 'Validation failed',
      issues: error.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
      })),
    });
    return;
  }

  const status =
    typeof (error as { status?: unknown }).status === 'number'
      ? (error as { status: number }).status
      : 500;

  if (status >= 500) {
    console.error(error);
  }

  res.status(status).json({
    error:
      status >= 500
        ? 'Internal server error'
        : status === 400
          ? 'Invalid JSON body'
          : (error as Error).message,
  });
};

app.use(errorHandler);
