import type { D1Database } from '@cloudflare/workers-types';
import type {
  TaskDB,
  CreateTaskInput,
  UpdateTaskInput,
  TaskListQuery,
} from '@todo/types';

/**
 * Database operations for tasks
 */
export class TaskRepository {
  constructor(private db: D1Database) {}

  async create(input: CreateTaskInput): Promise<TaskDB> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const task: TaskDB = {
      id,
      title: input.title,
      notes: input.notes || null,
      enhancedDescription: null,
      status: 'open',
      priority: input.priority || null,
      dueDate: input.dueDate || null,
      createdAt: now,
      updatedAt: now,
    };

    await this.db
      .prepare(
        `INSERT INTO tasks (id, title, notes, enhancedDescription, status, priority, dueDate, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        task.id,
        task.title,
        task.notes,
        task.enhancedDescription,
        task.status,
        task.priority,
        task.dueDate,
        task.createdAt,
        task.updatedAt
      )
      .run();

    return task;
  }

  async findById(id: string): Promise<TaskDB | null> {
    const result = await this.db
      .prepare('SELECT * FROM tasks WHERE id = ?')
      .bind(id)
      .first<TaskDB>();

    return result || null;
  }

  async findAll(query: TaskListQuery): Promise<TaskDB[]> {
    let sql = 'SELECT * FROM tasks WHERE 1=1';
    const bindings: any[] = [];

    if (query.status) {
      sql += ' AND status = ?';
      bindings.push(query.status);
    }

    if (query.priority) {
      sql += ' AND priority = ?';
      bindings.push(parseInt(query.priority, 10));
    }

    if (query.q) {
      sql += ' AND title LIKE ?';
      bindings.push(`%${query.q}%`);
    }

    sql += ' ORDER BY createdAt DESC';

    const stmt = this.db.prepare(sql);
    if (bindings.length > 0) {
      const result = await stmt.bind(...bindings).all<TaskDB>();
      return result.results || [];
    }

    const result = await stmt.all<TaskDB>();
    return result.results || [];
  }

  async update(id: string, input: UpdateTaskInput): Promise<TaskDB | null> {
    const existing = await this.findById(id);
    if (!existing) return null;

    const updated: TaskDB = {
      ...existing,
      ...input,
      updatedAt: new Date().toISOString(),
    };

    await this.db
      .prepare(
        `UPDATE tasks 
         SET title = ?, notes = ?, enhancedDescription = ?, status = ?, priority = ?, dueDate = ?, updatedAt = ?
         WHERE id = ?`
      )
      .bind(
        updated.title,
        updated.notes,
        updated.enhancedDescription,
        updated.status,
        updated.priority,
        updated.dueDate,
        updated.updatedAt,
        id
      )
      .run();

    return updated;
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.db
      .prepare('DELETE FROM tasks WHERE id = ?')
      .bind(id)
      .run();

    return result.success && (result.meta.changes || 0) > 0;
  }
}

