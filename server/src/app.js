import express from 'express';
import cors from 'cors';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import env from './config/env.js';
import routes from './routes/index.js';
import { notFound, errorHandler } from './middleware/errorHandler.js';
import { securityHeaders, rateLimit } from './middleware/security.js';

const FIFTEEN_MINUTES = 15 * 60 * 1000;
const app = express();

app.disable('x-powered-by');
app.set('trust proxy', 1); // behind Render / Vercel / Nginx proxies

app.use(securityHeaders);
app.use(
  cors({
    origin(origin, callback) {
      // Allow tools without an Origin header (Postman, curl, health checks) and the configured frontends.
      if (!origin || env.clientUrls.includes(origin)) return callback(null, true);
      return callback(null, false);
    },
    credentials: true,
  })
);
app.use(express.json({ limit: '1mb' }));

// Brute-force protection on credential endpoints, plus an overall API ceiling in production.
const authLimiter = rateLimit({
  name: 'auth',
  windowMs: FIFTEEN_MINUTES,
  max: env.authRateLimit,
  message: 'Too many sign-in attempts. Please wait a few minutes and try again.',
});
app.use(['/api/auth/login', '/api/auth/register'], authLimiter);
app.use('/api', rateLimit({ name: 'api', windowMs: FIFTEEN_MINUTES, max: env.apiRateLimit }));

app.use('/api', routes);

// Optional: serve the built frontend from the same origin (SERVE_CLIENT=true).
if (env.serveClient) {
  const dist = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../client/dist');
  if (fs.existsSync(dist)) {
    app.use(express.static(dist, { index: false, maxAge: '1h' }));
    app.get(/^(?!\/api).*/, (_req, res) => res.sendFile(path.join(dist, 'index.html')));
    console.log(`[server] Serving frontend from ${dist}`);
  } else {
    console.warn('[server] SERVE_CLIENT=true but client/dist was not found – run the client build first.');
  }
}

app.use(notFound);
app.use(errorHandler);

export default app;
