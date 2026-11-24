import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.ts';

export const todosRouter = Router();

const titleSchema = z
  .string()
  .trim()
  .min(1, 'Title is required')
  .max(160, 'Title must be 160 characters or fewer');

const createTodoSchema = z.object({
  title: titleSchema,
});

const updateTodoSchema = z
  .object({
    title: titleSchema.optional(),
    completed: z.boolean().optional(),
  })
  .refine((data) => data.title !== undefined || data.completed !== undefined, {
    message: 'Provide a title or a completed value',
  });

const listQuerySchema = z.object({
  status: z.enum(['all', 'active', 'completed']).default('all'),
});

const idSchema = z.string().uuid('Todo id must be a valid UUID');

todosRouter.get('/', async (req, res) => {
  const { status } = listQuerySchema.parse(req.query);

  const where =
    status === 'active'
      ? { completed: false }
      : status === 'completed'
        ? { completed: true }
        : {};

  const todos = await prisma.todo.findMany({
    where,
    orderBy: [{ completed: 'asc' }, { createdAt: 'desc' }],
  });

  res.json(todos);
});

todosRouter.post('/', async (req, res) => {
  const { title } = createTodoSchema.parse(req.body);
  const todo = await prisma.todo.create({ data: { title } });
  res.status(201).json(todo);
});

todosRouter.delete('/completed', async (_req, res) => {
  const result = await prisma.todo.deleteMany({ where: { completed: true } });
  res.json({ deleted: result.count });
});

todosRouter.get('/:id', async (req, res) => {
  const id = idSchema.parse(req.params.id);
  const todo = await prisma.todo.findUnique({ where: { id } });

  if (!todo) {
    res.status(404).json({ error: 'Todo not found' });
    return;
  }

  res.json(todo);
});

todosRouter.patch('/:id', async (req, res) => {
  const id = idSchema.parse(req.params.id);
  const data = updateTodoSchema.parse(req.body);

  const existing = await prisma.todo.findUnique({ where: { id } });
  if (!existing) {
    res.status(404).json({ error: 'Todo not found' });
    return;
  }

  const todo = await prisma.todo.update({ where: { id }, data });
  res.json(todo);
});

todosRouter.delete('/:id', async (req, res) => {
  const id = idSchema.parse(req.params.id);

  const existing = await prisma.todo.findUnique({ where: { id } });
  if (!existing) {
    res.status(404).json({ error: 'Todo not found' });
    return;
  }

  await prisma.todo.delete({ where: { id } });
  res.status(204).send();
});
