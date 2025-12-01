import { useState } from 'react';
import type { TaskResponse } from '@todo/types';
import { parseEnhancedDescription } from '@todo/utils';
import './TaskCard.css';

interface TaskCardProps {
  task: TaskResponse;
  onUpdate: (id: string, data: any) => void;
  onDelete: (id: string) => void;
  onEnhance: (id: string) => void;
  isEnhancing?: boolean;
}

export default function TaskCard({
  task,
  onUpdate,
  onDelete,
  onEnhance,
  isEnhancing,
}: TaskCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const [editNotes, setEditNotes] = useState(task.notes || '');
  const [editEnhanced, setEditEnhanced] = useState(task.enhancedDescription || '');

  const enhanced = parseEnhancedDescription(task.enhancedDescription);
  const priorityLabels: Record<number, string> = { 1: 'High', 2: 'Medium', 3: 'Low' };
  const priorityColors: Record<number, string> = {
    1: '#ef4444',
    2: '#f59e0b',
    3: '#10b981',
  };

  const handleSave = () => {
    onUpdate(task.id, {
      title: editTitle.trim(),
      notes: editNotes.trim() || null,
      enhancedDescription: editEnhanced.trim() || null,
    });
    setIsEditing(false);
  };

  const handleToggleStatus = () => {
    onUpdate(task.id, {
      status: task.status === 'open' ? 'done' : 'open',
    });
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className={`task-card ${task.status === 'done' ? 'done' : ''}`}>
      <div className="task-header">
        <div className="task-title-row">
          {isEditing ? (
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="edit-input"
              autoFocus
            />
          ) : (
            <h3 className="task-title">{task.title}</h3>
          )}
          {task.priority && (
            <span
              className="priority-badge"
              style={{ backgroundColor: priorityColors[task.priority] }}
            >
              {priorityLabels[task.priority]}
            </span>
          )}
        </div>
        <div className="task-actions">
          <button
            className="btn btn-small btn-secondary"
            onClick={() => (isEditing ? handleSave() : setIsEditing(true))}
            aria-label={isEditing ? 'Save task' : 'Edit task'}
          >
            {isEditing ? 'Save' : 'Edit'}
          </button>
          {!isEditing && (
            <>
              <button
                className="btn btn-small btn-primary"
                onClick={() => onEnhance(task.id)}
                disabled={isEnhancing}
                aria-label="Enhance with AI"
              >
                {isEnhancing ? 'Enhancing...' : '✨ Enhance'}
              </button>
              <button
                className="btn btn-small btn-secondary"
                onClick={handleToggleStatus}
                aria-label={task.status === 'open' ? 'Mark as done' : 'Mark as open'}
              >
                {task.status === 'open' ? '✓ Done' : '↩ Reopen'}
              </button>
              <button
                className="btn btn-small btn-danger"
                onClick={() => onDelete(task.id)}
                aria-label="Delete task"
              >
                Delete
              </button>
            </>
          )}
        </div>
      </div>

      {task.notes && (
        <div className="task-notes">
          {isEditing ? (
            <textarea
              value={editNotes}
              onChange={(e) => setEditNotes(e.target.value)}
              className="edit-textarea"
              rows={2}
            />
          ) : (
            <p>{task.notes}</p>
          )}
        </div>
      )}

      {enhanced && (
        <div className="enhanced-description">
          <div className="ai-badge">🤖 AI Generated</div>
          <p className="summary">{enhanced.summary}</p>
          {enhanced.steps.length > 0 && (
            <div className="steps">
              <strong>Steps:</strong>
              <ul>
                {enhanced.steps.map((step, idx) => (
                  <li key={idx}>{step}</li>
                ))}
              </ul>
            </div>
          )}
          {enhanced.risks.length > 0 && (
            <div className="risks">
              <strong>Risks:</strong>
              <ul>
                {enhanced.risks.map((risk, idx) => (
                  <li key={idx}>{risk}</li>
                ))}
              </ul>
            </div>
          )}
          <div className="estimate">
            <strong>Estimated Time:</strong> {enhanced.estimateHours} hours
          </div>
          {isEditing && (
            <textarea
              value={editEnhanced}
              onChange={(e) => setEditEnhanced(e.target.value)}
              className="edit-textarea"
              rows={4}
              placeholder="Edit enhanced description (JSON)"
            />
          )}
        </div>
      )}

      {!enhanced && isEditing && (
        <div className="enhanced-description">
          <label>Enhanced Description (JSON):</label>
          <textarea
            value={editEnhanced}
            onChange={(e) => setEditEnhanced(e.target.value)}
            className="edit-textarea"
            rows={4}
            placeholder='{"summary": "...", "steps": [], "risks": [], "estimateHours": 0}'
          />
        </div>
      )}

      <div className="task-meta">
        {task.dueDate && (
          <span className="due-date">
            Due: {formatDate(task.dueDate)}
          </span>
        )}
        <span className="created-date">
          Created: {formatDate(task.createdAt)}
        </span>
      </div>
    </div>
  );
}

