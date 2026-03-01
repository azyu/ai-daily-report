import type { FastifyInstance } from 'fastify';
import { listReports, getReportByDate } from '../services/reportService.js';

export async function reportRoutes(app: FastifyInstance) {
  app.get('/reports', async () => listReports());

  app.get('/reports/:date', async (req, reply) => {
    const { date } = req.params as { date: string };
    const report = await getReportByDate(date);
    if (!report) return reply.code(404).send({ message: 'Not found' });
    return report;
  });

  // Deprecated: credential headers are removed for security reasons.
  app.post('/admin/reports/:date/run', async (_req, reply) => {
    return reply.code(410).send({
      message: 'Deprecated endpoint. Use token-authenticated /api/admin-run with Authorization: Bearer <token>.'
    });
  });
}
