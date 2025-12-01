import { useState } from 'react';
import type { CreateTaskInput } from '@todo/types';
import './TaskForm.css';

interface TaskFormProps {
  onSubmit: (data: CreateTaskInput) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export default function TaskForm({ onSubmit, onCancel, isLoading }: TaskFormProps) {
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [priority, setPriority] = useState<1 | 2 | 3 | undefined>();
  const [dueDate, setDueDate] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onSubmit({
      title: title.trim(),
      notes: notes.trim() || undefined,
      priority,
      dueDate: dueDate || undefined,
    });

    // Reset form
    setTitle('');
    setNotes('');
    setPriority(undefined);
    setDueDate('');
  };

  return (
    <form className="task-form" onSubmit={handleSubmit}>
      <h2>Create New Task</h2>

      <div className="form-group">
        <label htmlFor="title">
          Title <span className="required">*</span>
        </label>
        <input
          id="title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          maxLength={200}
          placeholder="Enter task title"
          aria-required="true"
        />
      </div>

      <div className="form-group">
        <label htmlFor="notes">Notes</label>
        <textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          maxLength={1000}
          rows={3}
          placeholder="Optional notes about the task"
        />
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="priority">Priority</label>
          <select
            id="priority"
            value={priority || ''}
            onChange={(e) =>
              setPriority(e.target.value ? (parseInt(e.target.value) as 1 | 2 | 3) : undefined)
            }
          >
            <option value="">None</option>
            <option value="1">High</option>
            <option value="2">Medium</option>
            <option value="3">Low</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="dueDate">Due Date</label>
          <input
            id="dueDate"
            type="datetime-local"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
        </div>
      </div>

      <div className="form-actions">
        <button type="button" className="btn btn-secondary" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary" disabled={isLoading || !title.trim()}>
          {isLoading ? 'Creating...' : 'Create Task'}
        </button>
      </div>
    </form>
  );
}

