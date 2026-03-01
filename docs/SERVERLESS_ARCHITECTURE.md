# Runtime and Deployment Notes

This repository ships one product through two runtime shapes:

- Vercel serverless
- Single-container Docker runtime for Coolify

Both paths use the same production source of truth: `api/ + frontend/`.

## Current Runtime Model

### Vercel

- `api/*.ts` are deployed as serverless handlers
- `frontend/dist` is served as the SPA output
- `/rss.xml` is rewritten to `/api/rss`
- Vercel Cron calls `/api/cron/daily-report`

### Docker / Coolify

- `server/index.ts` starts a small Node HTTP server
- The server mounts the same `api/*.ts` handlers
- `frontend/dist` is served statically from the same process
- Non-API routes fall back to `frontend/dist/index.html`

## Request Flow

### Main page

1. The SPA requests `GET /api/reports?bootstrap=1`
2. The API returns the report list plus the latest report detail
3. Changing the selected date triggers `GET /api/reports?date=YYYY-MM-DD`

This removes the old initial waterfall of `list -> select -> detail`.

### RSS

- `GET /rss.xml` returns the latest report feed
- `GET /rss.xml?date=YYYY-MM-DD` returns a dated feed
- RSS output is cached in Redis when available

### Admin run

1. Authenticated admin calls `POST /api/admin-run`
2. The API creates a queued job record
3. Background execution runs the report job
4. Clients poll `GET /api/job-status?id=...`

On Vercel, background work is registered through `waitUntil`. In the container runtime, the task runs in-process after the `202` response is returned.

## Security Model

- Admin setup requires `ADMIN_SETUP_SECRET` via header
- Admin login issues an `HttpOnly` cookie
- Deployed HTTPS environments use `Secure` cookies
- Local `localhost` HTTP only relaxes `Secure` for browser testing
- Cron auth fails closed when `CRON_SECRET` is missing or invalid
- Redis locking prevents duplicate daily report generation

## Required Environment

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

## Deployment Checks

After each deploy, verify:

- `/`
- `/api/health`
- `/api/reports`
- `/api/reports?bootstrap=1`
- `/rss.xml`

For scheduler-backed environments, also verify:

- `POST /api/cron/daily-report` with cron auth
- `POST /api/admin-run` and `GET /api/job-status?id=...`

## Operational Notes

- DB is the source of truth
- Cache is acceleration only
- `backend/` is still in the repository but is not the production runtime
- The container image is Alpine-based via `node:24-alpine`
