import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { HTTPException } from 'hono/http-exception';
import type { Env } from './types';
import { TaskRepository } from './db';
import { enhanceTaskWithLLM } from './llm';
import { RateLimiter, getClientIP } from '@todo/utils';
import {
  CreateTaskSchema,
  UpdateTaskSchema,
  TaskListQuerySchema,
  ErrorResponseSchema,
} from '@todo/types';

const app = new Hono<{ Bindings: Env }>();

// CORS middleware
app.use('/*', cors({
  origin: '*', // In production, restrict to your frontend domain
  allowMethods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type'],
}));

// Rate limiter instance (in production, use Cloudflare KV or Durable Objects)
const rateLimiter = new RateLimiter(10, 60000); // 10 requests per minute

// Middleware for rate limiting LLM endpoints
async function rateLimitMiddleware(c: any, next: any) {
  const ip = getClientIP(c.req.raw);
  const result = await rateLimiter.check(ip);

  if (!result.allowed) {
    throw new HTTPException(429, {
      message: 'Rate limit exceeded. Please try again later.',
    });
  }

  c.set('rateLimitRemaining', result.remaining);
  await next();
}

// Health check
app.get('/health', (c) => {
  return c.json({ status: 'ok' });
});

// List tasks
app.get('/api/tasks', async (c) => {
  try {
    const query = TaskListQuerySchema.parse({
      status: c.req.query('status'),
      priority: c.req.query('priority'),
      q: c.req.query('q'),
    });

    const repo = new TaskRepository(c.env.DB);
    const tasks = await repo.findAll(query);
    return c.json(tasks);
  } catch (error: any) {
    throw new HTTPException(400, { message: error.message });
  }
});

// Get single task
app.get('/api/tasks/:id', async (c) => {
  const id = c.req.param('id');
  const repo = new TaskRepository(c.env.DB);
  const task = await repo.findById(id);

  if (!task) {
    throw new HTTPException(404, { message: 'Task not found' });
  }

  return c.json(task);
});

// Create task
app.post('/api/tasks', async (c) => {
  try {
    const body = await c.req.json();
    const input = CreateTaskSchema.parse(body);

    const repo = new TaskRepository(c.env.DB);
    const task = await repo.create(input);

    return c.json(task, 201);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      throw new HTTPException(400, { message: `Validation error: ${error.message}` });
    }
    throw new HTTPException(500, { message: error.message });
  }
});

// Update task
app.patch('/api/tasks/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json();
    const input = UpdateTaskSchema.parse(body);

    const repo = new TaskRepository(c.env.DB);
    const task = await repo.update(id, input);

    if (!task) {
      throw new HTTPException(404, { message: 'Task not found' });
    }

    return c.json(task);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      throw new HTTPException(400, { message: `Validation error: ${error.message}` });
    }
    if (error instanceof HTTPException) throw error;
    throw new HTTPException(500, { message: error.message });
  }
});

// Delete task
app.delete('/api/tasks/:id', async (c) => {
  const id = c.req.param('id');
  const repo = new TaskRepository(c.env.DB);
  const deleted = await repo.delete(id);

  if (!deleted) {
    throw new HTTPException(404, { message: 'Task not found' });
  }

  return c.json({ success: true });
});

// Enhance task with LLM
app.post('/api/tasks/:id/enhance', rateLimitMiddleware, async (c) => {
  try {
    const id = c.req.param('id');
    const repo = new TaskRepository(c.env.DB);
    const task = await repo.findById(id);

    if (!task) {
      throw new HTTPException(404, { message: 'Task not found' });
    }

    if (!c.env.OPENAI_API_KEY) {
      throw new HTTPException(500, { message: 'OpenAI API key not configured' });
    }

    const enhanced = await enhanceTaskWithLLM(
      task.title,
      task.notes,
      c.env.OPENAI_API_KEY
    );

    const updated = await repo.update(id, {
      enhancedDescription: JSON.stringify(enhanced),
    });

    return c.json(updated);
  } catch (error: any) {
    if (error instanceof HTTPException) throw error;
    throw new HTTPException(500, { message: error.message });
  }
});

// Error handler
app.onError((err, c) => {
  if (err instanceof HTTPException) {
    return c.json(
      ErrorResponseSchema.parse({
        error: err.message,
        message: err.message,
      }),
      err.status
    );
  }

  console.error('Unhandled error:', err);
  return c.json(
    ErrorResponseSchema.parse({
      error: 'Internal server error',
      message: err.message,
    }),
    500
  );
});

export default app;

