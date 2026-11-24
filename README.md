# todo-be

The Todo API: Express 5, Prisma 7, PostgreSQL, TypeScript, and Zod validation.

## Local setup

```bash
cp .env.example .env
npm install
npm run db:migrate
npm run dev
```

The API starts on `http://localhost:3000`. It expects Postgres at the
`DATABASE_URL` in `.env` (the root Compose stack exposes it on port 5433).

## Scripts

| Script               | Purpose                                      |
| -------------------- | -------------------------------------------- |
| `npm run dev`        | Generate the client and run in watch mode    |
| `npm run build`      | Generate the Prisma client and compile `src` |
| `npm start`          | Run the compiled API from `dist/`            |
| `npm run typecheck`  | Generate the client and typecheck with no emit |
| `npm run db:generate` | Regenerate the Prisma client                |
| `npm run db:migrate` | Create and apply a development migration     |
| `npm run db:deploy`  | Apply committed migrations                   |
| `npm run db:seed`    | Insert starter todos (only when the table is empty) |
| `npm run db:studio`  | Open Prisma Studio                           |
| `npm run db:reset`   | Reset the database and re-apply migrations   |

## Structure

```
prisma/
  schema.prisma        Todo model
  migrations/          Committed SQL migrations
  seed.ts              Optional starter data
src/
  app.ts               Express app, health checks, error handling
  index.ts             Server bootstrap + graceful shutdown
  env.ts               Environment validation
  lib/prisma.ts        Prisma client with the pg adapter
  routes/todos.ts      REST endpoints
  generated/prisma/    Generated client (not committed)
prisma7.config.ts      Prisma 7 CLI configuration
```

## Notes

- Prisma 7 is engine-free. `src/lib/prisma.ts` connects through
  `@prisma/adapter-pg`; the generated client is emitted as TypeScript into
  `src/generated/prisma` and compiled with the app.
- In Docker, the runtime image applies `prisma migrate deploy` on start and
  then runs `node dist/index.js` as a non-root user.
- `/health` is a pure liveness check. `/ready` runs `SELECT 1` against
  Postgres and is the better target for upstream readiness probes.
