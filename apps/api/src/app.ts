import cors from 'cors';
import express from 'express';

import { authRouter } from './auth/router';
import { bookingsRouter } from './bookings/router';
import { journeysRouter } from './journeys/router';
import { seedDemoData } from './data/seed';

export function createApp() {
  const app = express();

  app.use(
    cors({
      origin: '*',
      allowedHeaders: ['Content-Type', 'Authorization'],
    }),
  );
  app.use(express.json());

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  app.use('/auth', authRouter);
  app.use('/journeys', journeysRouter);
  app.use('/bookings', bookingsRouter);

  app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    // eslint-disable-next-line no-console
    console.error(err);
    res.status(500).json({ error: 'InternalServerError', message: err.message });
  });

  // Seed demo data when app boots. In production use proper migrations/seeding.
  if (!app.locals.demoSeeded) {
    const seedResult = seedDemoData();
    app.locals.demoSeeded = true;
    app.locals.demoDefaults = seedResult;
  }

  return app;
}
