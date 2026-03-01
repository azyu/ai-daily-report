#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

docker compose -f "$ROOT/infra/docker-compose.redis.yml" up -d

echo "[1/2] Start backend: cd $ROOT/backend && npm run dev"
echo "[2/2] Start frontend: cd $ROOT/frontend && npm run dev"
