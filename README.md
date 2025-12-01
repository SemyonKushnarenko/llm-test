# Full-Stack LLM To-Do App

A modern, AI-powered task management application built with Cloudflare Workers, React, and OpenAI. This monorepo demonstrates a complete full-stack application with LLM integration for enhancing task descriptions.

## 🏗️ Architecture

```
┌─────────────────┐
│   React + Vite  │  Frontend (Cloudflare Pages)
│      (FE)       │
└────────┬────────┘
         │ HTTP/REST
         ▼
┌─────────────────┐
│ Cloudflare      │  Backend API (Cloudflare Workers)
│ Worker + Hono   │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
┌────────┐ ┌──────────┐
│  D1    │ │  OpenAI  │
│ (SQLite│ │   API    │
│  DB)   │ │          │
└────────┘ └──────────┘
```

### Tech Stack

**Frontend:**
- React 18 with TypeScript
- Vite for build tooling
- React Query for data fetching
- Modern CSS with responsive design

**Backend:**
- Cloudflare Workers (edge runtime)
- Hono framework (lightweight HTTP framework)
- Cloudflare D1 (SQLite database)
- OpenAI API for LLM completions

**Monorepo:**
- pnpm workspaces
- Shared TypeScript types and utilities
- Zod for runtime validation

## 📁 Project Structure

```
/
├── apps/
│   ├── api/              # Cloudflare Worker API
│   │   ├── src/
│   │   │   ├── index.ts          # Main API routes
│   │   │   ├── db.ts             # Database operations
│   │   │   ├── llm.ts            # OpenAI integration
│   │   │   ├── types.ts          # Environment types
│   │   │   └── migrations/       # SQL migrations
│   │   ├── wrangler.toml         # Cloudflare config
│   │   └── package.json
│   │
│   └── web/              # React frontend
│       ├── src/
│       │   ├── components/       # React components
│       │   ├── App.tsx           # Main app component
│       │   └── main.tsx          # Entry point
│       ├── vite.config.ts
│       └── package.json
│
├── packages/
│   ├── types/            # Shared TypeScript types & Zod schemas
│   └── utils/            # Shared utilities (rate limiting, etc.)
│
├── package.json          # Root workspace config
└── README.md
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and pnpm 8+
- Cloudflare account (free tier works)
- OpenAI API key (or another LLM provider)

### Installation

1. **Clone the repository:**
   ```bash
   git clone <repo-url>
   cd assignment
   ```

2. **Install dependencies:**
   ```bash
   pnpm install
   ```

3. **Set up Cloudflare D1 database:**
   ```bash
   cd apps/api
   npx wrangler d1 create todo-db
   ```
   
   Copy the database ID from the output and update `wrangler.toml`:
   ```toml
   [[d1_databases]]
   binding = "DB"
   database_name = "todo-db"
   database_id = "your-database-id-here"
   ```

4. **Run database migrations:**
   ```bash
   pnpm db:migrate:local  # For local development
   ```

5. **Set up environment variables:**
   
   For the API (Cloudflare Workers):
   ```bash
   cd apps/api
   npx wrangler secret put OPENAI_API_KEY
   # Enter your OpenAI API key when prompted
   ```
   
   For local development, create `apps/api/.dev.vars`:
   ```
   OPENAI_API_KEY=your-openai-api-key-here
   ```

   For the frontend, create `apps/web/.env.local`:
   ```
   VITE_API_URL=http://localhost:8787
   ```

### Development

**Run both frontend and backend:**
```bash
pnpm dev
```

This starts:
- Frontend at `http://localhost:3000`
- API at `http://localhost:8787`

**Run individually:**
```bash
# Frontend only
cd apps/web && pnpm dev

# API only
cd apps/api && pnpm dev
```

### Database Migrations

```bash
# Local development
cd apps/api
pnpm db:migrate:local

# Production
pnpm db:migrate
```

## 🧪 Testing

```bash
# Run all tests
pnpm test

# Run API tests
cd apps/api && pnpm test

# Run frontend tests
cd apps/web && pnpm test
```

## 📦 Building

```bash
# Build all packages
pnpm build

# Build individually
cd apps/web && pnpm build
cd apps/api && pnpm build
```

## 🚢 Deployment

### Deploy to Cloudflare

1. **Deploy the API (Cloudflare Workers):**
   ```bash
   cd apps/api
   pnpm deploy
   ```
   
   Note: Make sure to set production secrets:
   ```bash
   npx wrangler secret put OPENAI_API_KEY --env production
   ```

2. **Deploy the Frontend (Cloudflare Pages):**
   
   Option A: Using Wrangler:
   ```bash
   cd apps/web
   pnpm build
   npx wrangler pages deploy dist
   ```
   
   Option B: Connect GitHub repo to Cloudflare Pages dashboard:
   - Build command: `cd apps/web && pnpm build`
   - Build output: `apps/web/dist`
   - Root directory: `/`

3. **Update frontend API URL:**
   
   After deploying the API, update the frontend environment variable:
   ```
   VITE_API_URL=https://your-api.workers.dev
   ```

### Environment Variables

**Production API (Cloudflare Workers):**
- Set via `wrangler secret put OPENAI_API_KEY --env production`

**Production Frontend (Cloudflare Pages):**
- Set `VITE_API_URL` in Cloudflare Pages environment variables

## 📊 Database Schema

```sql
CREATE TABLE tasks (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  notes TEXT,
  enhancedDescription TEXT,  -- JSON string from LLM
  status TEXT NOT NULL CHECK(status IN ('open', 'done')) DEFAULT 'open',
  priority INTEGER CHECK(priority IN (1, 2, 3)),  -- 1=high, 2=medium, 3=low
  dueDate TEXT,  -- ISO datetime string
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
);
```

## 🔌 API Endpoints

### Tasks

- `GET /api/tasks` - List tasks (query params: `status`, `priority`, `q`)
- `GET /api/tasks/:id` - Get single task
- `POST /api/tasks` - Create task
- `PATCH /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task
- `POST /api/tasks/:id/enhance` - Generate AI-enhanced description

### Request/Response Examples

**Create Task:**
```json
POST /api/tasks
{
  "title": "Build login page",
  "notes": "Need authentication",
  "priority": 1,
  "dueDate": "2024-01-15T10:00:00Z"
}
```

**Enhanced Description Response:**
```json
{
  "summary": "Build a secure login page with email/password authentication...",
  "steps": [
    "Create login form component",
    "Implement validation",
    "Add error handling"
  ],
  "risks": [
    "Security vulnerabilities",
    "User experience issues"
  ],
  "estimateHours": 4
}
```

## 🎨 Features

- ✅ Create, read, update, delete tasks
- ✅ Filter by status and priority
- ✅ Search tasks by title
- ✅ AI-powered task enhancement (OpenAI GPT-3.5)
- ✅ Priority levels (High/Medium/Low)
- ✅ Due dates
- ✅ Mark tasks as done/open
- ✅ Responsive design
- ✅ Accessible UI (keyboard navigation, ARIA labels)
- ✅ Rate limiting on LLM endpoints
- ✅ Input validation with Zod

## 🔒 Security & Best Practices

- Input validation on all endpoints (Zod schemas)
- Rate limiting on LLM endpoints (10 requests/minute per IP)
- CORS configured for frontend domain
- SQL injection protection via parameterized queries
- Type-safe API with TypeScript end-to-end
- Error handling with proper HTTP status codes

## 🐛 Known Limitations

1. **Rate Limiting**: Currently uses in-memory rate limiting. For production, consider Cloudflare KV or Durable Objects for distributed rate limiting.

2. **Authentication**: No user authentication implemented. All tasks are shared. For production, add user sessions or authentication.

3. **Database**: D1 is SQLite-based and has eventual consistency. For high-traffic apps, consider a more robust database.

4. **LLM Costs**: OpenAI API calls incur costs. Monitor usage and consider caching or alternative providers.

5. **Error Handling**: Basic error handling implemented. Production apps should have more comprehensive error tracking (e.g., Sentry).

## 🛠️ Development Notes

### Adding New Features

1. **New API endpoint**: Add route in `apps/api/src/index.ts`
2. **New type**: Add to `packages/types/src/index.ts`
3. **New component**: Add to `apps/web/src/components/`

### Type Safety

The monorepo uses TypeScript throughout. Types are shared via the `@todo/types` package, ensuring consistency between frontend and backend.

### LLM Integration

The LLM enhancement uses OpenAI's GPT-3.5-turbo model. To use a different provider:
1. Update `apps/api/src/llm.ts`
2. Modify the API call and response parsing
3. Update environment variable names

## 📝 License

This project is a take-home assignment.

## 👤 Author

Built as a full-stack take-home assignment demonstrating:
- Monorepo architecture
- Cloudflare Workers/Pages deployment
- LLM integration
- Type-safe full-stack development
- Modern React patterns

