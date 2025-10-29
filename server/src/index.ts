import express from 'express';
import cors from 'cors';
import { config } from './config.js';
import './db/migrate.js';
import { availabilityRouter } from './routes/availability.js';
import { reservationsRouter } from './routes/reservations.js';
import { adminRouter } from './routes/admin.js';

const app = express();

app.use(
  cors({
    origin: '*'
  })
);
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/availability', availabilityRouter);
app.use('/api/reservations', reservationsRouter);
app.use('/api/admin', adminRouter);

app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: err.message });
});

app.listen(config.port, () => {
  console.log(`Server listening on port ${config.port}`);
});
