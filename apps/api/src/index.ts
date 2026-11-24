import { createApp } from './app.js';
import { env } from './config/env.js';
import { logEvent } from './utils/logger.js';

const app = createApp();

app.listen(env.port, () => {
  logEvent({
    level: 'info',
    message: `Betul District Intelligence API listening on http://localhost:${env.port}`,
    meta: { env: env.nodeEnv, aiServiceUrl: env.aiServiceUrl },
  });
});
