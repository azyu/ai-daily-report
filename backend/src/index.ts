import 'dotenv/config';
import Fastify from 'fastify';
import fastifyCors from '@fastify/cors';
import { prisma } from './prisma.js';
import { startScheduler } from './scheduler.js';
import { startReportWorker } from './queue.js';
import { systemRoutes } from './routes/systemRoutes.js';
import { authRoutes } from './routes/authRoutes.js';
import { reportRoutes } from './routes/reportRoutes.js';

const app = Fastify({ logger: true });
const port = Number(process.env.PORT ?? 4000);

app.register(fastifyCors, { origin: true });
await systemRoutes(app);
await authRoutes(app);
await reportRoutes(app);

const worker = startReportWorker();
startScheduler();

app.listen({ port, host: '0.0.0.0' }).catch((e) => {
  app.log.error(e);
  process.exit(1);
});

process.on('SIGINT', async () => {
  await worker.close();
  await prisma.$disconnect();
  process.exit(0);
});
