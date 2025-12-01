# Quick Start Guide

Get the LLM To-Do App running in 5 minutes!

## Prerequisites Check

- [ ] Node.js 18+ installed (`node --version`)
- [ ] pnpm 8+ installed (`pnpm --version`)
- [ ] Cloudflare account (free tier works)
- [ ] OpenAI API key (get one at https://platform.openai.com/api-keys)

## Step 1: Install Dependencies

```bash
pnpm install
```

## Step 2: Set Up Cloudflare D1 Database

```bash
cd apps/api
npx wrangler d1 create todo-db
```

Copy the `database_id` from the output.

## Step 3: Configure Database

Edit `apps/api/wrangler.toml` and replace `your-database-id-here` with the actual database ID:

```toml
database_id = "abc123def456..."  # Your actual ID
```

## Step 4: Run Migrations

```bash
# For local development
pnpm db:migrate:local

# Or from the root:
cd apps/api
npx wrangler d1 migrations apply todo-db --local
```

## Step 5: Set Up Environment Variables

### API (Cloudflare Worker)

Create `apps/api/.dev.vars`:

```bash
OPENAI_API_KEY=sk-your-openai-api-key-here
```

### Frontend

Create `apps/web/.env.local`:

```bash
VITE_API_URL=http://localhost:8787
```

## Step 6: Start Development Servers

From the root directory:

```bash
pnpm dev
```

This starts:
- ✅ Frontend at http://localhost:3000
- ✅ API at http://localhost:8787

## Step 7: Test It Out!

1. Open http://localhost:3000 in your browser
2. Click "+ New Task"
3. Enter a task title (e.g., "Build login page")
4. Add optional notes
5. Click "Create Task"
6. Click "✨ Enhance" to generate AI-powered description
7. View the enhanced description with steps, risks, and time estimate!

## Troubleshooting

### "Database not found" error

Make sure you:
1. Created the D1 database with `wrangler d1 create`
2. Updated `wrangler.toml` with the correct database ID
3. Ran migrations with `--local` flag for local dev

### "OpenAI API key not configured" error

1. Check that `apps/api/.dev.vars` exists
2. Verify the API key is correct (starts with `sk-`)
3. Make sure you have credits in your OpenAI account

### Frontend can't connect to API

1. Verify API is running on port 8787
2. Check `apps/web/.env.local` has `VITE_API_URL=http://localhost:8787`
3. Restart the frontend dev server after changing env vars

### Port already in use

Change ports in:
- API: `apps/api/wrangler.toml` (add `port = 8788` under `[dev]`)
- Frontend: `apps/web/vite.config.ts` (change `server.port`)

## Next Steps

- Read [README.md](./README.md) for full documentation
- Check [CODE_EXPLANATION.md](./CODE_EXPLANATION.md) for architecture details
- Deploy to Cloudflare (see README deployment section)

## Need Help?

- Check the main [README.md](./README.md)
- Review error messages in the browser console and terminal
- Verify all environment variables are set correctly

