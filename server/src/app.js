import express from 'express';
import cors from 'cors';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import env from './config/env.js';
import routes from './routes/index.js';
import { notFound, errorHandler } from './middleware/errorHandler.js';
import { securityHeaders, rateLimit } from './middleware/security.js';
import { connectDB } from './config/db.js';
import ApiError from './utils/ApiError.js';

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

/**
 * Ensure the MongoDB connection before any API work. connectDB() caches its promise, so this is a
 * no-op once connected. This makes the app self-sufficient when a platform imports it directly
 * (e.g. Vercel's Express support loads src/app.js and never runs server.js's start()).
 */
app.use('/api', async (_req, _res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error('[db] Connection failed:', err.message);
    next(new ApiError(503, 'The database is temporarily unavailable. Please try again shortly.', undefined, 'DB_UNAVAILABLE'));
  }
});

app.use('/api', routes);

// A friendly answer at the bare domain, so the API root doesn't look broken.
app.get('/', (_req, res) => {
  if (env.serveClient) return res.redirect('/index.html');
  res.json({ success: true, message: 'IronVault API', data: { health: '/api/health', docs: 'All endpoints are under /api' } });
});

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
