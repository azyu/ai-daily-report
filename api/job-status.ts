import { getJobStatus } from './_lib/cache.js';

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') return res.status(405).json({ message: 'Method Not Allowed' });
  const id = req.query?.id as string | undefined;
  if (!id) return res.status(400).json({ message: 'id required' });

  const status = await getJobStatus(id);
  if (!status) return res.status(404).json({ message: 'not found' });
  return res.status(200).json(status);
}
