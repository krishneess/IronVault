/**
 * Shared helpers for the IronVault end-to-end API suite.
 *
 * The suite talks to a RUNNING API over HTTP (like the React client does) and creates its own
 * accounts. Everything it creates is marked so `npm run test:cleanup` can remove it:
 *   - user emails end with  @e2e.ironvault.test
 *   - membership tier names start with  "E2E "
 */
import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(here, '../../.env'), quiet: true });

export const E2E_DOMAIN = 'e2e.ironvault.test';
export const E2E_TIER_PREFIX = 'E2E ';
export const API = (process.env.E2E_API_URL || 'http://localhost:5000/api').replace(/\/$/, '');
export const ADMIN = {
  identifier: process.env.E2E_ADMIN_IDENTIFIER || process.env.ADMIN_USERNAME || 'admin',
  password: process.env.E2E_ADMIN_PASSWORD || process.env.ADMIN_PASSWORD,
};

/** Refuse to run against production by accident. */
export function assertSafeTarget() {
  if (process.env.NODE_ENV === 'production' && process.env.E2E_ALLOW_PRODUCTION !== 'true') {
    console.error('Refusing to run the e2e suite with NODE_ENV=production (set E2E_ALLOW_PRODUCTION=true to override).');
    process.exit(1);
  }
  if (!ADMIN.password) {
    console.error('Set ADMIN_PASSWORD (server/.env) or E2E_ADMIN_PASSWORD so the suite can sign in as an administrator.');
    process.exit(1);
  }
}

// ---------------------------------------------------------------- HTTP + assertions

export async function req(method, urlPath, body, token) {
  const res = await fetch(API + urlPath, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token && { Authorization: `Bearer ${token}` }) },
    body: body === undefined ? undefined : typeof body === 'string' ? body : JSON.stringify(body),
  });
  let json = null;
  try {
    json = await res.json();
  } catch {
    json = null;
  }
  return { status: res.status, body: json };
}

export function createSuite(name) {
  let pass = 0;
  let fail = 0;
  const failures = [];
  return {
    check(label, condition, detail) {
      if (condition) pass += 1;
      else {
        fail += 1;
        failures.push(label);
      }
      console.log(`${condition ? '  ✓' : '  ✗'} ${label}${condition ? '' : `\n      → ${JSON.stringify(detail).slice(0, 400)}`}`);
    },
    section(title) {
      console.log(`\n${name} · ${title}`);
    },
    result: () => ({ name, pass, fail, failures }),
  };
}

// ---------------------------------------------------------------- fixtures

let counter = 0;
export const uid = (prefix) => `${prefix}${Date.now().toString(36)}${(counter++).toString(36)}`;

export async function login(identifier, password) {
  const r = await req('POST', '/auth/login', { identifier, password });
  return r.body?.data?.token;
}

export const adminToken = () => login(ADMIN.identifier, ADMIN.password);

/** Self-registers a member; returns { token, id, username, email, password }. */
export async function registerMember(name = 'E2E Member', extra = {}) {
  const username = uid('e2e_m');
  const email = `${username}@${E2E_DOMAIN}`;
  const password = 'Passw0rd!e2e';
  const r = await req('POST', '/auth/register', { name, email, username, password, ...extra });
  if (r.status !== 201) throw new Error(`register failed: ${JSON.stringify(r.body)}`);
  return { token: r.body.data.token, id: r.body.data.user._id, username, email, password };
}

/** Admin creates a trainer account; returns { token, id, username, password }. */
export async function createTrainer(adminTok, name = 'E2E Trainer', extra = {}) {
  const username = uid('e2e_t');
  const password = 'Trainer123e2e';
  const r = await req(
    'POST',
    '/admin/trainers',
    { name, email: `${username}@${E2E_DOMAIN}`, username, password, specialization: 'Strength', experience: 5, ...extra },
    adminTok
  );
  if (r.status !== 201) throw new Error(`create trainer failed: ${JSON.stringify(r.body)}`);
  return { token: await login(username, password), id: r.body.data._id, username, password };
}

export async function createTier(adminTok, overrides = {}) {
  const r = await req(
    'POST',
    '/membership-tiers',
    { name: `${E2E_TIER_PREFIX}${uid('Tier ')}`, durationInDays: 30, price: 999, maxHoldDays: 10, features: ['E2E'], ...overrides },
    adminTok
  );
  if (r.status !== 201) throw new Error(`create tier failed: ${JSON.stringify(r.body)}`);
  return r.body.data;
}

/** Takes a member through Created → PaymentPending → Active (admin path). Returns the membership id. */
export async function activateMembership(adminTok, memberId, tierId) {
  const created = await req('POST', '/memberships', { memberId, tierId }, adminTok);
  const id = created.body.data._id;
  await req('POST', `/memberships/${id}/transitions`, { action: 'submit' }, adminTok);
  const v = await req('POST', `/memberships/${id}/transitions`, { action: 'verify_payment', paymentMethod: 'cash' }, adminTok);
  if (v.body?.data?.status !== 'active') throw new Error(`activation failed: ${JSON.stringify(v.body)}`);
  return id;
}

export const today = (offsetDays = 0) => new Date(Date.now() + offsetDays * 86400000).toISOString().slice(0, 10);
