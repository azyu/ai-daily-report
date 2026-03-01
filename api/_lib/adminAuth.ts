import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import { prisma } from './db.js';

const TOKEN_SECRET = process.env.ADMIN_TOKEN_SECRET || process.env.ADMIN_RUN_SECRET;

function b64(input: string) {
  return Buffer.from(input).toString('base64url');
}

function requireSecret() {
  if (!TOKEN_SECRET) throw new Error('ADMIN_TOKEN_SECRET missing');
  return TOKEN_SECRET;
}

export function signToken(adminId: string, ttlSec = 60 * 60 * 2) {
  const exp = Math.floor(Date.now() / 1000) + ttlSec;
  const payload = `${adminId}.${exp}`;
  const sig = crypto.createHmac('sha256', requireSecret()).update(payload).digest('base64url');
  return `${b64(payload)}.${sig}`;
}

export function verifyToken(token?: string) {
  if (!token) return null;
  const [p, sig] = token.split('.');
  if (!p || !sig) return null;
  const payload = Buffer.from(p, 'base64url').toString('utf8');
  const expected = crypto.createHmac('sha256', requireSecret()).update(payload).digest('base64url');
  const a = Buffer.from(expected);
  const b = Buffer.from(sig);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  const [adminId, expStr] = payload.split('.');
  const exp = Number(expStr);
  if (!adminId || !exp || exp < Math.floor(Date.now() / 1000)) return null;
  return { adminId, exp };
}

export function parseCookieToken(req: any) {
  const cookie = (req.headers['cookie'] || '') as string;
  const m = cookie.match(/(?:^|;\s*)admin_token=([^;]+)/);
  return m ? decodeURIComponent(m[1]) : undefined;
}

export async function adminStatus() {
  const cfg = await prisma.adminConfig.findUnique({ where: { id: 1 } });
  return { initialized: !!cfg };
}

export async function setupAdmin(adminId: string, password: string) {
  const exists = await prisma.adminConfig.findUnique({ where: { id: 1 } });
  if (exists) return { ok: false, code: 409, message: 'already_initialized' };
  const hash = await bcrypt.hash(password, 12);
  await prisma.adminConfig.create({ data: { id: 1, adminId, passwordHash: hash } });
  return { ok: true };
}

export async function loginAdmin(adminId: string, password: string) {
  const cfg = await prisma.adminConfig.findUnique({ where: { id: 1 } });
  if (!cfg || cfg.adminId !== adminId) return false;
  return bcrypt.compare(password, cfg.passwordHash);
}
