# Code Explanation

This document provides a detailed explanation of the codebase architecture and implementation.

## Monorepo Structure

The project uses **pnpm workspaces** to manage a monorepo with three main packages:

1. **`packages/types`** - Shared TypeScript types and Zod schemas
2. **`packages/utils`** - Shared utility functions
3. **`apps/api`** - Cloudflare Worker backend
4. **`apps/web`** - React frontend application

## Package: `@todo/types`

**Location:** `packages/types/src/index.ts`

This package defines all shared types and validation schemas using Zod. It ensures type safety across the entire application.

### Key Types:

- **`TaskStatus`**: Enum for task status (`'open' | 'done'`)
- **`Priority`**: Number type for priority (1=high, 2=medium, 3=low)
- **`EnhancedDescription`**: Structure for AI-generated content:
  ```typescript
  {
    summary: string;
    steps: string[];
    risks: string[];
    estimateHours: number;
  }
  ```
- **`TaskDB`**: Database representation of a task
- **`CreateTaskSchema`** / **`UpdateTaskSchema`**: Zod schemas for API validation

### Why Zod?

Zod provides runtime validation that matches TypeScript types, ensuring:
- Type safety at compile time
- Runtime validation for API requests
- Automatic error messages for invalid input

## Package: `@todo/utils`

**Location:** `packages/utils/src/index.ts`

Shared utilities used by both frontend and backend.

### RateLimiter Class

Simple in-memory rate limiter for LLM endpoints:
- Tracks requests per IP address
- Configurable window (default: 60 seconds) and max requests (default: 10)
- **Note:** For production, this should use Cloudflare KV or Durable Objects for distributed rate limiting

### Helper Functions

- **`parseEnhancedDescription`**: Safely parses JSON string to `EnhancedDescription` type
- **`getClientIP`**: Extracts client IP from Cloudflare request headers

## Backend: Cloudflare Worker API

**Location:** `apps/api/src/`

### Architecture

The API uses **Hono**, a lightweight HTTP framework optimized for edge runtimes like Cloudflare Workers.

### File Structure

#### `index.ts` - Main API Routes

Defines all HTTP endpoints:

1. **`GET /health`** - Health check endpoint
2. **`GET /api/tasks`** - List tasks with filtering
3. **`GET /api/tasks/:id`** - Get single task
4. **`POST /api/tasks`** - Create new task
5. **`PATCH /api/tasks/:id`** - Update task
6. **`DELETE /api/tasks/:id`** - Delete task
7. **`POST /api/tasks/:id/enhance`** - Generate AI-enhanced description

**Key Features:**
- CORS middleware for cross-origin requests
- Rate limiting on LLM endpoints
- Zod validation on all inputs
- Proper error handling with HTTP status codes

#### `db.ts` - Database Layer

**`TaskRepository` class** provides a clean interface for database operations:

- **`create`**: Inserts new task with UUID and timestamps
- **`findById`**: Retrieves single task by ID
- **`findAll`**: Lists tasks with optional filtering (status, priority, search)
- **`update`**: Updates task fields
- **`delete`**: Removes task from database

**Database:** Cloudflare D1 (SQLite) with the following schema:
```sql
CREATE TABLE tasks (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  notes TEXT,
  enhancedDescription TEXT,  -- JSON string
  status TEXT CHECK(status IN ('open', 'done')) DEFAULT 'open',
  priority INTEGER CHECK(priority IN (1, 2, 3)),
  dueDate TEXT,  -- ISO datetime string
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
);
```

**Indexes:** Added on `status`, `priority`, `createdAt`, and `title` for query performance.

#### `llm.ts` - OpenAI Integration

**`enhanceTaskWithLLM` function:**

1. Constructs a prompt from task title and notes
2. Calls OpenAI GPT-3.5-turbo API
3. Parses JSON response
4. Returns structured `EnhancedDescription`

**Prompt Structure:**
- System message: Defines the assistant's role
- User message: Includes task title and notes
- Response: JSON with summary, steps, risks, and time estimate

**Error Handling:**
- Handles API errors (network, rate limits, etc.)
- Validates JSON response format
- Strips markdown code blocks if present

#### `types.ts` - Environment Types

Defines the `Env` interface for Cloudflare Workers bindings:
- `DB`: D1 database binding
- `OPENAI_API_KEY`: API key for OpenAI

### Migrations

**Location:** `apps/api/src/migrations/0001_initial.sql`

SQL migration file for initial database schema. Cloudflare D1 uses migration files to version the database schema.

## Frontend: React Application

**Location:** `apps/web/src/`

### Architecture

- **React 18** with functional components and hooks
- **React Query** for server state management
- **Vite** for fast development and optimized builds
- **TypeScript** for type safety

### Component Structure

#### `App.tsx` - Main Application Component

**State Management:**
- Uses React Query for data fetching and caching
- Manages filter state locally
- Coordinates mutations (create, update, delete, enhance)

**API Functions:**
- `fetchTasks`: GET request with query parameters
- `createTask`: POST request to create task
- `updateTask`: PATCH request to update task
- `deleteTask`: DELETE request
- `enhanceTask`: POST request to LLM enhancement endpoint

**Features:**
- Automatic refetching on mutations
- Loading and error states
- Form toggle for creating tasks

#### `TaskForm.tsx` - Task Creation Form

**Fields:**
- Title (required, max 200 chars)
- Notes (optional, max 1000 chars)
- Priority (dropdown: High/Medium/Low)
- Due Date (datetime-local input)

**Validation:**
- Client-side validation (required fields)
- Max length constraints
- Form submission disabled when invalid

**Accessibility:**
- Proper labels with `htmlFor` attributes
- Required field indicators
- ARIA attributes

#### `TaskList.tsx` - Task List Container

Simple container component that:
- Maps over tasks array
- Renders `TaskCard` for each task
- Shows empty state when no tasks

#### `TaskCard.tsx` - Individual Task Display

**Features:**
- Displays all task information
- Edit mode for inline editing
- AI-enhanced description rendering
- Action buttons (Edit, Enhance, Toggle Status, Delete)

**Enhanced Description Display:**
- Parses JSON from `enhancedDescription` field
- Renders summary, steps (as checklist), risks, and time estimate
- Shows "AI Generated" badge
- Allows manual editing of JSON in edit mode

**Status Toggle:**
- Switches between 'open' and 'done'
- Visual indication (strikethrough, opacity) for done tasks

#### `FilterBar.tsx` - Filtering UI

**Filters:**
- Status dropdown (All/Open/Done)
- Priority dropdown (All/High/Medium/Low)
- Search input (searches task titles)

**Implementation:**
- Controlled inputs
- Updates parent state on change
- Triggers React Query refetch automatically

### Styling

**Approach:** CSS modules with modern CSS features

**Design Principles:**
- Gradient backgrounds for visual appeal
- Card-based layout
- Responsive design (mobile-first)
- Accessible color contrasts
- Smooth transitions and hover effects

**Responsive Breakpoints:**
- Desktop: Full layout with side-by-side elements
- Mobile: Stacked layout, full-width buttons

## Data Flow

### Creating a Task

1. User fills form in `TaskForm`
2. Form submission calls `createMutation.mutate()`
3. React Query sends POST to `/api/tasks`
4. API validates with Zod schema
5. `TaskRepository.create()` inserts into D1
6. API returns created task
7. React Query invalidates cache
8. UI refetches and displays new task

### Enhancing a Task with AI

1. User clicks "✨ Enhance" button
2. `enhanceMutation.mutate(taskId)` called
3. React Query sends POST to `/api/tasks/:id/enhance`
4. API rate limiter checks IP
5. `enhanceTaskWithLLM()` calls OpenAI API
6. Response parsed and stored in `enhancedDescription`
7. Task updated in database
8. UI refetches and displays enhanced description

### Filtering Tasks

1. User changes filter in `FilterBar`
2. Filter state updates in `App`
3. React Query automatically refetches with new query params
4. API filters results in SQL query
5. Filtered tasks displayed in UI

## Error Handling

### Backend

- **Validation Errors:** 400 Bad Request with Zod error details
- **Not Found:** 404 with descriptive message
- **Rate Limit:** 429 Too Many Requests
- **Server Errors:** 500 with error message
- **LLM Errors:** Caught and returned as 500

### Frontend

- React Query handles network errors automatically
- Error messages displayed in UI
- Loading states prevent duplicate requests
- Form validation prevents invalid submissions

## Security Considerations

1. **Input Validation:** All inputs validated with Zod schemas
2. **SQL Injection:** Parameterized queries prevent SQL injection
3. **Rate Limiting:** LLM endpoints rate-limited to prevent abuse
4. **CORS:** Configured for frontend domain (should be restricted in production)
5. **API Keys:** Stored as Cloudflare secrets, not in code
6. **Type Safety:** TypeScript prevents many runtime errors

## Performance Optimizations

1. **Database Indexes:** Added on frequently queried fields
2. **React Query Caching:** Reduces unnecessary API calls
3. **Code Splitting:** Vite automatically code-splits
4. **Edge Deployment:** Cloudflare Workers run at the edge for low latency
5. **Optimistic Updates:** Can be added for better UX (not implemented)

## Testing

### Backend Tests

**Location:** `apps/api/src/index.test.ts`

- Tests `TaskRepository` with mocked D1 database
- Validates data structure and operations

### Frontend Tests

**Location:** `apps/web/src/components/TaskCard.test.tsx`

- Tests React component rendering
- Validates props and display logic

**Test Setup:**
- Vitest for test runner
- jsdom for DOM simulation
- React Testing Library for component testing

## Deployment Considerations

### Cloudflare Workers

- **Cold Starts:** Minimal due to V8 isolates
- **Scaling:** Automatic, no configuration needed
- **Global Distribution:** Runs at edge locations worldwide

### Cloudflare D1

- **Consistency:** Eventual consistency (read-after-write may have delays)
- **Limits:** Free tier has request limits
- **Backups:** Manual backups recommended for production

### Cloudflare Pages

- **Build:** Runs `pnpm build` in `apps/web`
- **Output:** Serves `dist` directory
- **Environment Variables:** Set in dashboard

## Future Improvements

1. **Authentication:** Add user sessions or magic links
2. **Real-time Updates:** WebSockets or Server-Sent Events
3. **Offline Support:** Service Workers and IndexedDB
4. **Advanced Filtering:** Date ranges, tags, etc.
5. **Bulk Operations:** Select multiple tasks
6. **Export/Import:** JSON or CSV export
7. **Analytics:** Track task completion rates
8. **Notifications:** Reminders for due dates

