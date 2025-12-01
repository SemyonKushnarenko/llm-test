import type { TaskListQuery } from '@todo/types';
import './FilterBar.css';

interface FilterBarProps {
  filters: TaskListQuery;
  onFiltersChange: (filters: TaskListQuery) => void;
}

export default function FilterBar({ filters, onFiltersChange }: FilterBarProps) {
  const updateFilter = (key: keyof TaskListQuery, value: any) => {
    onFiltersChange({ ...filters, [key]: value || undefined });
  };

  return (
    <div className="filter-bar">
      <div className="filter-group">
        <label htmlFor="filter-status">Status</label>
        <select
          id="filter-status"
          value={filters.status || ''}
          onChange={(e) => updateFilter('status', e.target.value)}
        >
          <option value="">All</option>
          <option value="open">Open</option>
          <option value="done">Done</option>
        </select>
      </div>

      <div className="filter-group">
        <label htmlFor="filter-priority">Priority</label>
        <select
          id="filter-priority"
          value={filters.priority || ''}
          onChange={(e) => updateFilter('priority', e.target.value)}
        >
          <option value="">All</option>
          <option value="1">High</option>
          <option value="2">Medium</option>
          <option value="3">Low</option>
        </select>
      </div>

      <div className="filter-group filter-search">
        <label htmlFor="filter-search">Search</label>
        <input
          id="filter-search"
          type="text"
          placeholder="Search by title..."
          value={filters.q || ''}
          onChange={(e) => updateFilter('q', e.target.value)}
        />
      </div>
    </div>
  );
}

