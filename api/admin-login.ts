import { loginAdmin, signToken } from './_lib/adminAuth.js';
import { buildAdminCookie } from './_lib/adminCookie.js';
import { getRedis } from './_lib/redis.js';

function clientKey(req: any) {
  const ip = (req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown').toString().split(',')[0].trim();
  return `admin:login:fail:${ip}`;
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method Not Allowed' });

  const { adminId, password } = req.body ?? {};
  if (!adminId || !password) return res.status(400).json({ message: 'adminId/password required' });

  const redis = getRedis();
  const key = clientKey(req);

  try {
    if (redis) {
      const failCount = Number((await redis.get(key)) || '0');
      if (failCount >= 5) return res.status(429).json({ message: 'too_many_attempts' });
    }
  } catch {}

  const ok = await loginAdmin(adminId, password);
  if (!ok) {
    try {
      if (redis) {
        const n = await redis.incr(key);
        if (n === 1) await redis.expire(key, 60 * 10);
      }
    } catch {}
    return res.status(401).json({ message: 'invalid_credentials' });
  }

  try { if (redis) await redis.del(key); } catch {}

  const token = signToken(adminId, 60 * 60 * 2);
  res.setHeader('Set-Cookie', buildAdminCookie(token, req));
  return res.status(200).json({ ok: true });
}
