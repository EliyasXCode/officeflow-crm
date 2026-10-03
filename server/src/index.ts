import app from './app';
import { connectDB, disconnectDB } from './config/db';
import { ENV } from './config/env';

const startServer = async () => {
  try {
    console.log('[OfficeFlow CRM] Initializing server...');
    const dbUri = await connectDB();
    console.log(`[OfficeFlow CRM] Database ready.`);
    if (ENV.NODE_ENV === 'development') {
      const { ensureDevSeed } = await import('./utils/devSeed');
      await ensureDevSeed();
    }

    const server = app.listen(ENV.PORT, () => {
      console.log(`====================================================`);
      console.log(`  OfficeFlow CRM Backend running on port ${ENV.PORT} `);
      console.log(`  Environment : ${ENV.NODE_ENV}                     `);
      console.log(`  Timezone    : ${ENV.DEFAULT_OFFICE_TIMEZONE}      `);
      console.log(`  Currency    : ${ENV.DEFAULT_CURRENCY}             `);
      console.log(`  AI Assistant: ${ENV.ENABLE_AI_ASSISTANT ? 'Enabled' : 'Disabled'} `);
      console.log(`====================================================`);
    });

    const shutdown = async (signal: string) => {
      console.log(`[OfficeFlow CRM] Received ${signal}. Shutting down gracefully...`);
      server.close(async () => {
        await disconnectDB();
        console.log('[OfficeFlow CRM] Closed all connections. Exiting.');
        process.exit(0);
      });
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
  } catch (err) {
    console.error('[OfficeFlow CRM] Fatal startup error:', err);
    process.exit(1);
  }
};

startServer();
