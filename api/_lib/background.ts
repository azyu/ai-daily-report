import { waitUntil } from '@vercel/functions';

function logBackgroundError(error: unknown) {
  console.error('background_task_failed', error);
}

type BackgroundRuntime = {
  isVercel: boolean;
  waitUntil: (promise: Promise<unknown>) => void;
};

const defaultRuntime: BackgroundRuntime = {
  isVercel: Boolean(process.env.VERCEL),
  waitUntil
};

export function scheduleBackgroundTask(task: () => Promise<void>, runtime: BackgroundRuntime = defaultRuntime) {
  const handled = Promise.resolve()
    .then(task)
    .catch((error) => {
      logBackgroundError(error);
    });

  if (runtime.isVercel) {
    runtime.waitUntil(handled);
    return;
  }

  void handled;
}
