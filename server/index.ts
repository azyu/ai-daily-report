import { createReadStream } from 'node:fs';
import { access, stat } from 'node:fs/promises';
import http, { type IncomingMessage, type ServerResponse } from 'node:http';
import path from 'node:path';

import adminLogin from '../api/admin-login.js';
import adminResetCache from '../api/admin-reset-cache.js';
import adminResetData from '../api/admin-reset-data.js';
import adminRun from '../api/admin-run.js';
import adminSetup from '../api/admin-setup.js';
import adminStatus from '../api/admin-status.js';
import cronDailyReport from '../api/cron/daily-report.js';
import health from '../api/health.js';
import jobStatus from '../api/job-status.js';
import reportPreview from '../api/report-preview.js';
import reports from '../api/reports.js';
import rss from '../api/rss.js';
import workerRun from '../api/worker-run.js';
import { getContentType, getReportDatePathname, resolvePublicFile, toQueryObject } from './runtime.js';

type Handler = (req: any, res: any) => Promise<unknown> | unknown;

const HOST = process.env.HOST || '0.0.0.0';
const PORT = Number(process.env.PORT || 3000);
const publicDir = path.resolve(process.cwd(), 'frontend', 'dist');
const indexFile = path.join(publicDir, 'index.html');

const routes = new Map<string, Handler>([
  ['/api/admin-login', adminLogin],
  ['/api/admin-reset-cache', adminResetCache],
  ['/api/admin-reset-data', adminResetData],
  ['/api/admin-run', adminRun],
  ['/api/admin-setup', adminSetup],
  ['/api/admin-status', adminStatus],
  ['/api/cron/daily-report', cronDailyReport],
  ['/api/health', health],
  ['/api/job-status', jobStatus],
  ['/api/report-preview', reportPreview],
  ['/api/reports', reports],
  ['/api/worker-run', workerRun],
  ['/rss.xml', rss]
]);

function attachResponseHelpers(res: ServerResponse) {
  const wrapped = res as ServerResponse & {
    status: (code: number) => typeof wrapped;
    json: (payload: unknown) => typeof wrapped;
    send: (payload: unknown) => typeof wrapped;
  };

  wrapped.status = (code: number) => {
    res.statusCode = code;
    return wrapped;
  };

  wrapped.json = (payload: unknown) => {
    if (!res.getHeader('Content-Type')) {
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
    }
    res.end(JSON.stringify(payload));
    return wrapped;
  };

  wrapped.send = (payload: unknown) => {
    if (payload === undefined) {
      res.end();
      return wrapped;
    }
    if (typeof payload === 'object' && !Buffer.isBuffer(payload)) {
      return wrapped.json(payload);
    }
    res.end(payload as string | Uint8Array);
    return wrapped;
  };

  return wrapped;
}

async function readBody(req: IncomingMessage) {
  if (req.method === 'GET' || req.method === 'HEAD') return undefined;

  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  if (!chunks.length) return undefined;

  const raw = Buffer.concat(chunks).toString('utf8');
  const contentType = req.headers['content-type'] || '';
  if (contentType.includes('application/json')) {
    return JSON.parse(raw);
  }

  return raw;
}

async function serveFile(res: ServerResponse, filePath: string, method: string | undefined) {
  res.statusCode = 200;
  res.setHeader('Content-Type', getContentType(filePath));

  if (method === 'HEAD') {
    res.end();
    return;
  }

  createReadStream(filePath).pipe(res);
}

async function tryServeStatic(req: IncomingMessage, res: ServerResponse, pathname: string) {
  if (req.method !== 'GET' && req.method !== 'HEAD') return false;

  const resolved = resolvePublicFile(publicDir, pathname);
  if (resolved) {
    try {
      const fileStat = await stat(resolved);
      if (fileStat.isFile()) {
        await serveFile(res, resolved, req.method);
        return true;
      }
    } catch {}
  }

  if (path.extname(pathname)) {
    res.statusCode = 404;
    res.end('Not Found');
    return true;
  }

  try {
    await access(indexFile);
    await serveFile(res, indexFile, req.method);
    return true;
  } catch {
    res.statusCode = 500;
    res.end('Missing frontend build');
    return true;
  }
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
  const pathname = url.pathname;
  const reportDate = getReportDatePathname(pathname);
  const handler = routes.get(pathname) || (reportDate ? reportPreview : undefined);

  if (!handler) {
    const served = await tryServeStatic(req, res, pathname);
    if (!served) {
      res.statusCode = 404;
      res.end('Not Found');
    }
    return;
  }

  const wrappedReq = req as IncomingMessage & { body?: unknown; query?: Record<string, string> };
  const wrappedRes = attachResponseHelpers(res);

  try {
    wrappedReq.query = toQueryObject(url.searchParams);
    if (reportDate) wrappedReq.query.date = reportDate;
    wrappedReq.body = await readBody(req);
  } catch {
    wrappedRes.status(400).json({ message: 'invalid_json' });
    return;
  }

  try {
    await handler(wrappedReq, wrappedRes);
  } catch (error) {
    console.error('request_failed', pathname, error);
    if (!res.writableEnded) {
      wrappedRes.status(500).json({ message: 'Internal Server Error' });
    }
  }
});

server.listen(PORT, HOST, () => {
  console.log(`ai-daily-report listening on http://${HOST}:${PORT}`);
});
