import { log } from './log';
import { dunningWorker } from './jobs/dunning';
import { purgeQueue, purgeWorker } from './jobs/purge';
import { sendEmailWorker } from './jobs/send-email';

async function main(): Promise<void> {
  log.info('workers starting…');
  // Schedule purge every hour
  await purgeQueue.add(
    'purge-cron',
    { trigger: 'cron' },
    {
      repeat: { every: 60 * 60 * 1000 },
      removeOnComplete: true,
      removeOnFail: 10,
    },
  );

  log.info('workers ready', {
    purge: !!purgeWorker,
    dunning: !!dunningWorker,
    sendEmail: !!sendEmailWorker,
  });
}

main().catch((err) => {
  console.error('worker bootstrap failed', err);
  process.exit(1);
});

for (const sig of ['SIGINT', 'SIGTERM'] as const) {
  process.on(sig, async () => {
    log.info(`Received ${sig} — shutting down workers`);
    await Promise.all([dunningWorker.close(), purgeWorker.close(), sendEmailWorker.close()]);
    process.exit(0);
  });
}
