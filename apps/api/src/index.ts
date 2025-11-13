import { createServer } from 'http';

import { createApp } from './app';

const port = Number(process.env.PORT ?? 3333);

function bootstrap() {
  const app = createApp();
  const server = createServer(app);
  server.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`API listening on http://localhost:${port}`);
    if (app.locals.demoDefaults) {
      // eslint-disable-next-line no-console
      console.log('Demo bookingId:', app.locals.demoDefaults.bookingId);
      // eslint-disable-next-line no-console
      console.log('Demo PNR:', app.locals.demoDefaults.pnr);
    }
  });
}

bootstrap();
