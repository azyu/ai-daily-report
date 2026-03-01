import { setupAdmin, signToken } from './_lib/adminAuth.js';
import { buildAdminCookie } from './_lib/adminCookie.js';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method Not Allowed' });

  const setupSecret = process.env.ADMIN_SETUP_SECRET;
  if (!setupSecret) return res.status(500).json({ message: 'setup_disabled' });
  if (req.headers['x-admin-setup-secret'] !== setupSecret) return res.status(401).json({ message: 'Unauthorized' });

  const { adminId, password } = req.body ?? {};
  if (!adminId || !password) return res.status(400).json({ message: 'adminId/password required' });
  const r = await setupAdmin(adminId, password);
  if (!r.ok) return res.status(r.code).json({ message: r.message });

  const token = signToken(adminId);
  res.setHeader('Set-Cookie', buildAdminCookie(token, req));
  return res.status(200).json({ ok: true });
}
