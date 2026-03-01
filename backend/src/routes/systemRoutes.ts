import type { FastifyInstance } from 'fastify';

export async function systemRoutes(app: FastifyInstance) {
  app.get('/health', async () => ({ ok: true }));
  app.get('/status', async () => ({ ok: true, service: 'ai-daily-report-backend', now: new Date().toISOString() }));
}
