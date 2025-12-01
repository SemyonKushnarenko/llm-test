import TaskCard from './TaskCard';
import type { TaskResponse } from '@todo/types';
import './TaskList.css';

interface TaskListProps {
  tasks: TaskResponse[];
  onUpdate: (id: string, data: any) => void;
  onDelete: (id: string) => void;
  onEnhance: (id: string) => void;
  isEnhancing?: boolean;
}

export default function TaskList({
  tasks,
  onUpdate,
  onDelete,
  onEnhance,
  isEnhancing,
}: TaskListProps) {
  if (tasks.length === 0) {
    return (
      <div className="empty-state">
        <p>No tasks found. Create your first task to get started!</p>
      </div>
    );
  }

  return (
    <div className="task-list">
      {tasks.map((task) => (
        <TaskCard
          key={task.id}
          task={task}
          onUpdate={onUpdate}
          onDelete={onDelete}
          onEnhance={onEnhance}
          isEnhancing={isEnhancing}
        />
      ))}
    </div>
  );
}

