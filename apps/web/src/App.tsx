import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import TaskList from './components/TaskList';
import TaskForm from './components/TaskForm';
import FilterBar from './components/FilterBar';
import type { TaskResponse, TaskListQuery } from '@todo/types';
import './App.css';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8787';

async function fetchTasks(query: TaskListQuery): Promise<TaskResponse[]> {
  const params = new URLSearchParams();
  if (query.status) params.append('status', query.status);
  if (query.priority) params.append('priority', query.priority);
  if (query.q) params.append('q', query.q);

  const response = await fetch(`${API_BASE}/api/tasks?${params}`);
  if (!response.ok) throw new Error('Failed to fetch tasks');
  return response.json();
}

async function createTask(data: any): Promise<TaskResponse> {
  const response = await fetch(`${API_BASE}/api/tasks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Failed to create task');
  return response.json();
}

async function updateTask(id: string, data: any): Promise<TaskResponse> {
  const response = await fetch(`${API_BASE}/api/tasks/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Failed to update task');
  return response.json();
}

async function deleteTask(id: string): Promise<void> {
  const response = await fetch(`${API_BASE}/api/tasks/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) throw new Error('Failed to delete task');
}

async function enhanceTask(id: string): Promise<TaskResponse> {
  const response = await fetch(`${API_BASE}/api/tasks/${id}/enhance`, {
    method: 'POST',
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to enhance task');
  }
  return response.json();
}

function App() {
  const [filters, setFilters] = useState<TaskListQuery>({});
  const [showForm, setShowForm] = useState(false);
  const queryClient = useQueryClient();

  const { data: tasks = [], isLoading, error } = useQuery(
    ['tasks', filters],
    () => fetchTasks(filters)
  );

  const createMutation = useMutation(createTask, {
    onSuccess: () => {
      queryClient.invalidateQueries(['tasks']);
      setShowForm(false);
    },
  });

  const updateMutation = useMutation(
    ({ id, data }: { id: string; data: any }) => updateTask(id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['tasks']);
      },
    }
  );

  const deleteMutation = useMutation(deleteTask, {
    onSuccess: () => {
      queryClient.invalidateQueries(['tasks']);
    },
  });

  const enhanceMutation = useMutation(enhanceTask, {
    onSuccess: () => {
      queryClient.invalidateQueries(['tasks']);
    },
  });

  return (
    <div className="app">
      <header className="app-header">
        <h1>✨ LLM To-Do App</h1>
        <p>AI-powered task management</p>
      </header>

      <FilterBar filters={filters} onFiltersChange={setFilters} />

      <div className="app-actions">
        <button
          className="btn btn-primary"
          onClick={() => setShowForm(!showForm)}
          aria-label="Add new task"
        >
          {showForm ? 'Cancel' : '+ New Task'}
        </button>
      </div>

      {showForm && (
        <TaskForm
          onSubmit={(data) => createMutation.mutate(data)}
          onCancel={() => setShowForm(false)}
          isLoading={createMutation.isLoading}
        />
      )}

      {error && (
        <div className="error-message" role="alert">
          Error: {(error as Error).message}
        </div>
      )}

      {isLoading ? (
        <div className="loading">Loading tasks...</div>
      ) : (
        <TaskList
          tasks={tasks}
          onUpdate={(id, data) => updateMutation.mutate({ id, data })}
          onDelete={(id) => deleteMutation.mutate(id)}
          onEnhance={(id) => enhanceMutation.mutate(id)}
          isEnhancing={enhanceMutation.isLoading}
        />
      )}
    </div>
  );
}

export default App;

