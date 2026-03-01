# AGENTS.md

This file is the working guide for humans/agents contributing to this repository.

## Philosophy
1. **Reliability first**: Prefer verifiable results over plausible-looking output.
2. **Security by default**: Design admin/auth/secret flows with least privilege and least exposure.
3. **Operational reality**: Build for serverless constraints (timeouts, concurrency, retries).
4. **Small, clear changes**: Keep commits focused and intention-revealing.

## Priority Order
1) Security / Auth / Authorization  
2) Data integrity (duplicate generation, cache consistency)  
3) Generation reliability (LLM stability)  
4) UX / Design  
5) Refactoring / optimization

## Do
- Treat `api/` + `frontend/` as the production source of truth.
- Keep all secrets in deployment environment variables.
- Validate auth/authorization flows first when touching admin features.
- Use Redis key prefixes (`report:*`, `job:*`, etc.).
- Persist explicit job states (`failed`, `locked`, `done`) instead of hiding failures.
- Run post-deploy smoke tests (`/`, `/api/health`, `/api/reports`).

## Do Not
- Do not store passwords/tokens in localStorage as plaintext.
- Do not reintroduce legacy header-password auth.
- Do not use `FLUSHALL` in normal production paths.
- Do not build internal secret-bearing calls from untrusted Host headers.
- Do not silently replace failed LLM summaries with template filler (unless explicitly approved).
- Do not treat `backend/` as the production path.

## Area-specific Guidance
### Frontend
- Do not expose admin-entry hints on the main page.
- Favor secure admin flows over convenience shortcuts.

### API
- Validate all external input (e.g., date format).
- Return clear auth failure status codes (401/403).
- Keep cron authentication fail-closed.

### Data / Cache
- DB is source of truth.
- Cache is acceleration only; recover from DB on miss/inconsistency.
- Distributed locks must have ownership-safe release semantics.

## Pre-PR Checklist
- [ ] Security impact reviewed (auth/permissions/secrets)
- [ ] Typecheck/build passing
- [ ] Local hooks passing (pre-commit, pre-push)
- [ ] Deployment/test/docs impact reviewed

## Communication Rules
- If uncertain, report uncertainty explicitly (no guessing).
- When something fails, report cause, impact, and next step.
- Target “operationally reliable,” not just “works once.”
