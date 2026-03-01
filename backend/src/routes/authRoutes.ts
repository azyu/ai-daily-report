import type { FastifyInstance } from 'fastify';
import type { AuthBody } from '../services/authService.js';
import { isAdminInitialized, setupAdmin, verifyAdmin } from '../services/authService.js';

export async function authRoutes(app: FastifyInstance) {
  app.get('/auth/status', async () => ({ initialized: await isAdminInitialized() }));

  app.post('/auth/setup', async (req, reply) => {
    const result = await setupAdmin(req.body as AuthBody);
    if (!result.ok) return reply.code(result.code).send({ message: result.message });
    return { ok: true };
  });

  app.post('/auth/login', async (req, reply) => {
    const body = req.body as AuthBody;
    if (!body?.adminId || !body?.password) return reply.code(400).send({ message: 'adminId/password required' });
    const ok = await verifyAdmin(body.adminId, body.password);
    if (!ok) return reply.code(401).send({ message: 'Invalid credentials' });
    return { ok: true };
  });
}
