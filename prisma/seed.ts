import { prisma } from '../src/lib/prisma.ts';

const starterTodos = [
  'Containerize the Todo API',
  'Add a Postgres healthcheck to Compose',
  'Write the first GitHub Actions pipeline',
  'Pin Node and Postgres base image versions',
  'Document the local development workflow',
];

async function main(): Promise<void> {
  const count = await prisma.todo.count();

  if (count > 0) {
    console.log(`Seed skipped: ${count} todo(s) already exist.`);
    return;
  }

  await prisma.todo.createMany({ data: starterTodos.map((title) => ({ title })) });
  console.log(`Seeded ${starterTodos.length} starter todos.`);
}

main()
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
