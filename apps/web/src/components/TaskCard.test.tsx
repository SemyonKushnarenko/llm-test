import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import TaskCard from './TaskCard';
import type { TaskResponse } from '@todo/types';

const mockTask: TaskResponse = {
  id: '1',
  title: 'Test Task',
  notes: 'Test notes',
  enhancedDescription: null,
  status: 'open',
  priority: 1,
  dueDate: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

describe('TaskCard', () => {
  it('renders task title', () => {
    render(
      <TaskCard
        task={mockTask}
        onUpdate={() => {}}
        onDelete={() => {}}
        onEnhance={() => {}}
      />
    );
    expect(screen.getByText('Test Task')).toBeDefined();
  });

  it('renders task notes', () => {
    render(
      <TaskCard
        task={mockTask}
        onUpdate={() => {}}
        onDelete={() => {}}
        onEnhance={() => {}}
      />
    );
    expect(screen.getByText('Test notes')).toBeDefined();
  });
});

