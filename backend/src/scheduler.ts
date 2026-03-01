import cron from 'node-cron';
import { reportQueue } from './queue.js';
import { ymd } from './lib/date.js';

export function startScheduler() {
  cron.schedule('0 0 * * *', async () => {
    const date = ymd(new Date());
    await reportQueue.add('collect-daily-report', { date }, { attempts: 3, removeOnComplete: 50, removeOnFail: 50 });
  }, { timezone: 'Asia/Seoul' });
}

export async function enqueueNow(date?: string) {
  const d = date ?? ymd(new Date());
  await reportQueue.add('collect-daily-report', { date: d }, { attempts: 3, removeOnComplete: 50, removeOnFail: 50 });
}
