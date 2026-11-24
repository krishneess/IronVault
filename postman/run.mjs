/**
 * Runs the Postman collection with Newman.
 *   node postman/run.mjs                  → local API, admin credentials read from server/.env
 *   BASE_URL=https://api.example.com/api ADMIN_PASSWORD=... node postman/run.mjs
 * Credentials are passed as --env-var so they are never written to the committed environment file.
 */
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const envFile = path.resolve(here, '../server/.env');
const fileEnv = fs.existsSync(envFile)
  ? Object.fromEntries(
      fs
        .readFileSync(envFile, 'utf8')
        .split(/\r?\n/)
        .filter((l) => /^\s*[A-Z_]+=/.test(l))
        .map((l) => {
          const i = l.indexOf('=');
          return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
        })
    )
  : {};

const baseUrl = process.env.BASE_URL || 'http://localhost:5000/api';
const adminIdentifier = process.env.ADMIN_IDENTIFIER || fileEnv.ADMIN_USERNAME || 'admin';
const adminPassword = process.env.ADMIN_PASSWORD || fileEnv.ADMIN_PASSWORD;
if (!adminPassword) {
  console.error('Set ADMIN_PASSWORD (environment or server/.env) to run the collection.');
  process.exit(1);
}

const args = [
  '--yes',
  'newman@6',
  'run',
  path.join(here, 'IronVault.postman_collection.json'),
  '-e',
  path.join(here, 'IronVault-Local.postman_environment.json'),
  '--env-var',
  `baseUrl=${baseUrl}`,
  '--env-var',
  `adminIdentifier=${adminIdentifier}`,
  '--env-var',
  `adminPassword=${adminPassword}`,
  '--color',
  'on',
  ...process.argv.slice(2),
];
const result = spawnSync('npx', args, { stdio: 'inherit', shell: process.platform === 'win32' });
process.exit(result.status ?? 1);
