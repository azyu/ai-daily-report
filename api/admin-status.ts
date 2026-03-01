import { adminStatus } from './_lib/adminAuth.js';

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') return res.status(405).json({ message: 'Method Not Allowed' });
  return res.status(200).json(await adminStatus());
}
