import { z } from 'zod';

// Task Status Enum
export const TaskStatus = z.enum(['open', 'done']);
export type TaskStatus = z.infer<typeof TaskStatus>;

// Priority: 1 = high, 2 = medium, 3 = low
export const Priority = z.number().int().min(1).max(3).nullable();
export type Priority = z.infer<typeof Priority>;

// Enhanced Description JSON Structure
export const EnhancedDescriptionSchema = z.object({
  summary: z.string().max(200),
  steps: z.array(z.string()),
  risks: z.array(z.string()),
  estimateHours: z.number().int().min(0).max(20),
});
export type EnhancedDescription = z.infer<typeof EnhancedDescriptionSchema>;

// Task Database Schema
export const TaskDBSchema = z.object({
  id: z.string(),
  title: z.string(),
  notes: z.string().nullable(),
  enhancedDescription: z.string().nullable(), // JSON string
  status: TaskStatus,
  priority: Priority,
  dueDate: z.string().nullable(), // ISO datetime string
  createdAt: z.string(), // ISO datetime string
  updatedAt: z.string(), // ISO datetime string
});
export type TaskDB = z.infer<typeof TaskDBSchema>;

// Task API Request/Response Schemas
export const CreateTaskSchema = z.object({
  title: z.string().min(1).max(200),
  notes: z.string().max(1000).optional(),
  priority: Priority.optional(),
  dueDate: z.string().datetime().optional(),
});
export type CreateTaskInput = z.infer<typeof CreateTaskSchema>;

export const UpdateTaskSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  notes: z.string().max(1000).optional().nullable(),
  enhancedDescription: z.string().max(5000).optional().nullable(),
  status: TaskStatus.optional(),
  priority: Priority.optional(),
  dueDate: z.string().datetime().optional().nullable(),
});
export type UpdateTaskInput = z.infer<typeof UpdateTaskSchema>;

export const TaskResponseSchema = TaskDBSchema;
export type TaskResponse = z.infer<typeof TaskResponseSchema>;

export const TaskListQuerySchema = z.object({
  status: TaskStatus.optional(),
  priority: z.string().optional(), // "1" | "2" | "3"
  q: z.string().optional(), // search query
});
export type TaskListQuery = z.infer<typeof TaskListQuerySchema>;

// API Error Response
export const ErrorResponseSchema = z.object({
  error: z.string(),
  message: z.string().optional(),
});
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;

