# ai-daily-report

AI Daily Report is a small web app that collects AI news, generates a daily report with Gemini, and serves it through a simple web UI and RSS feed.

The production source of truth is `api/ + frontend/`. The old `backend/` directory is a legacy local prototype and is not the deployment path.

## Features

- Daily AI report browsing by date
- Bootstrap loading path for faster first render
- RSS feed for the latest report or a specific date
- Hidden admin tooling for setup, login, cache reset, and manual regeneration
- Background report generation with job status tracking
- Shared runtime model for Vercel serverless and Docker/Coolify

## Architecture

| Layer | Runtime | Notes |
| --- | --- | --- |
| Frontend | React + Vite SPA | Built into `frontend/dist` |
| API | Vercel Functions or Node container runtime | Source lives in `api/` |
| Data | Postgres + Prisma | DB is the source of truth |
| Cache / lock | Redis | Cache acceleration and distributed locking |
| LLM | Gemini | Primary + fallback model flow |
| Scheduler | Vercel Cron or Coolify Scheduled Task | Calls `/api/cron/daily-report` |

## Repository Layout

| Path | Purpose |
| --- | --- |
| `frontend/` | React client |
| `api/` | Production API handlers, Prisma schema, pipeline logic |
| `server/` | Container runtime that serves SPA + API from one process |
| `docs/` | Deployment and architecture notes |
| `backend/` | Legacy local prototype, not the production path |

## Requirements

- Node.js 24+
- npm
- Postgres
- Redis
- Gemini API key

## Environment Variables

Required:

- `DATABASE_URL`
- `REDIS_URL`
- `GEMINI_API_KEY`
- `GEMINI_MODEL`
- `GEMINI_FALLBACK_MODEL`
- `GEMINI_TIMEOUT_MS`
- `CRON_SECRET`
- `ADMIN_RUN_SECRET`
- `ADMIN_TOKEN_SECRET`
- `ADMIN_SETUP_SECRET`

Optional:

- `SUMMARY_MIN_CHARS`
- `SUMMARY_MAX_CHARS`
- `REPORT_CACHE_TTL_SEC`
- `APP_BASE_URL`

## Quick Start

### Docker

This is the simplest way to run the current production path locally.

```bash
docker build -t ai-daily-report .

docker run --rm -p 3000:3000 \
  -e DATABASE_URL=... \
  -e REDIS_URL=... \
  -e GEMINI_API_KEY=... \
  -e GEMINI_MODEL=... \
  -e GEMINI_FALLBACK_MODEL=... \
  -e GEMINI_TIMEOUT_MS=... \
  -e CRON_SECRET=... \
  -e ADMIN_RUN_SECRET=... \
  -e ADMIN_TOKEN_SECRET=... \
  -e ADMIN_SETUP_SECRET=... \
  ai-daily-report
```

Then open `http://localhost:3000`.

> [!NOTE]
> Local Docker over plain `http://localhost:3000` relaxes the admin cookie `Secure` flag only for localhost. Deployed HTTPS environments still use `Secure` cookies.

### Frontend-only dev

```bash
npm install
npm --prefix frontend install
npm --prefix frontend run dev
```

The Vite dev server proxies `/api` and `/rss.xml` to `http://localhost:4000`.

Use Docker if you want to run the current full production runtime locally.

## API Overview

### Public

- `GET /api/health`
- `GET /api/reports`
- `GET /api/reports?date=YYYY-MM-DD`
- `GET /api/reports?bootstrap=1`
- `GET /rss.xml`
- `GET /rss.xml?date=YYYY-MM-DD`

### Admin / operations

- `GET /api/admin-status`
- `POST /api/admin-setup`
- `POST /api/admin-login`
- `POST /api/admin-run?date=YYYY-MM-DD`
- `POST /api/admin-reset-data`
- `POST /api/admin-reset-cache`
- `GET /api/job-status?id=...`
- `POST /api/cron/daily-report`

## Build and Verification

```bash
npm run build:frontend
npm run build:server
npm run typecheck:frontend
node --test api/_lib/*.test.ts server/*.test.ts
```

## Deployment

### Vercel

```bash
vercel --prod
```

`vercel.json` builds the SPA, rewrites `/rss.xml` to `/api/rss`, and runs the daily cron at `0 15 * * *` UTC, which is midnight KST.

### Coolify

- Build from the root `Dockerfile`
- Expose port `3000`
- Health check: `GET /api/health`
- Configure the scheduled task to call `/api/cron/daily-report`
- Send `x-cron-secret: $CRON_SECRET` or `Authorization: Bearer $CRON_SECRET`

See [docs/SERVERLESS_ARCHITECTURE.md](docs/SERVERLESS_ARCHITECTURE.md) for the current runtime and deployment notes.
