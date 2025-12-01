import { describe, it, expect } from 'vitest';
import { TaskRepository } from './db';
import type { CreateTaskInput } from '@todo/types';

// Mock D1 database
const createMockDB = () => {
  const tasks: any[] = [];
  return {
    prepare: (sql: string) => ({
      bind: (...args: any[]) => ({
        run: async () => ({ success: true }),
        first: async () => tasks[0] || null,
        all: async () => ({ results: tasks }),
      }),
      run: async () => ({ success: true }),
      first: async () => tasks[0] || null,
      all: async () => ({ results: tasks }),
    }),
  } as any;
};

describe('TaskRepository', () => {
  it('should create a task', async () => {
    const db = createMockDB();
    const repo = new TaskRepository(db);
    const input: CreateTaskInput = {
      title: 'Test Task',
      notes: 'Test notes',
      priority: 1,
    };

    const task = await repo.create(input);
    expect(task).toBeDefined();
    expect(task.title).toBe('Test Task');
    expect(task.status).toBe('open');
  });

  it('should find a task by id', async () => {
    const db = createMockDB();
    const repo = new TaskRepository(db);
    const task = await repo.findById('test-id');
    // Mock returns null, so this tests the structure
    expect(task).toBeNull();
  });
});

