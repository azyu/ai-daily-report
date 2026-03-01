import bcrypt from 'bcryptjs';
import { prisma } from '../prisma.js';

export type AuthBody = { adminId: string; password: string };

export async function isAdminInitialized() {
  const config = await prisma.adminConfig.findUnique({ where: { id: 1 } });
  return !!config;
}

export async function setupAdmin(body: AuthBody) {
  const exists = await prisma.adminConfig.findUnique({ where: { id: 1 } });
  if (exists) return { ok: false as const, code: 409, message: 'Admin already initialized' };
  if (!body?.adminId || !body?.password) return { ok: false as const, code: 400, message: 'adminId/password required' };

  const passwordHash = await bcrypt.hash(body.password, 12);
  await prisma.adminConfig.create({ data: { id: 1, adminId: body.adminId, passwordHash } });
  return { ok: true as const };
}

export async function verifyAdmin(adminId?: string, password?: string) {
  if (!adminId || !password) return false;
  const config = await prisma.adminConfig.findUnique({ where: { id: 1 } });
  if (!config) return false;
  if (config.adminId !== adminId) return false;
  return bcrypt.compare(password, config.passwordHash);
}
