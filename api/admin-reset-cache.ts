import { verifyToken, parseCookieToken } from './_lib/adminAuth.js';
import { flushAllCache } from './_lib/cache.js';

function getBearer(req: any) {
  const h = req.headers['authorization'] || '';
  return h.startsWith('Bearer ') ? h.slice(7) : undefined;
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method Not Allowed' });
  const v = verifyToken(getBearer(req) || parseCookieToken(req));
  if (!v) return res.status(401).json({ message: 'Unauthorized' });
  const info = await flushAllCache();
  return res.status(200).json({ ok: true, cache: info });
}
