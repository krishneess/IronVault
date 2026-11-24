import dotenv from 'dotenv';

dotenv.config({ quiet: true });

const nodeEnv = process.env.NODE_ENV || 'development';
const isProduction = nodeEnv === 'production';

const problems = [];
for (const key of ['MONGODB_URI', 'JWT_SECRET']) {
  if (!process.env[key]) problems.push(`${key} is required`);
}
if (isProduction) {
  if ((process.env.JWT_SECRET || '').length < 32) problems.push('JWT_SECRET must be at least 32 characters in production');
  if (!process.env.CLIENT_URL) problems.push('CLIENT_URL (the deployed frontend origin) is required in production');
}
if (problems.length) {
  console.error(`[config] Invalid environment:\n  - ${problems.join('\n  - ')}`);
  process.exit(1);
}

const int = (value, fallback) => {
  const n = parseInt(value, 10);
  return Number.isNaN(n) ? fallback : n;
};

const env = {
  nodeEnv,
  isProduction,
  port: int(process.env.PORT, 5000),
  mongoUri: process.env.MONGODB_URI,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  clientUrls: (process.env.CLIENT_URL || 'http://localhost:5173')
    .split(',')
    .map((url) => url.trim().replace(/\/$/, ''))
    .filter(Boolean),
  // Requests per IP per 15 minutes. Generous in development so automated tests are not throttled.
  authRateLimit: int(process.env.AUTH_RATE_LIMIT, isProduction ? 20 : 1000),
  apiRateLimit: int(process.env.API_RATE_LIMIT, isProduction ? 900 : 0),
  // Optionally serve the built React app from this server (single-service deployment).
  serveClient: process.env.SERVE_CLIENT === 'true',
  // Optional custom DNS resolvers for Atlas SRV lookups, e.g. "1.1.1.1,8.8.8.8".
  dnsServers: (process.env.DNS_SERVERS || '').split(',').map((s) => s.trim()).filter(Boolean),
};

if (isProduction && /127\.0\.0\.1|localhost/.test(env.mongoUri)) {
  console.warn('[config] Warning: MONGODB_URI points to a local database in production.');
}

export default env;
