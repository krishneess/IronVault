/**
 * Runs the IronVault end-to-end API suite against a running server, then removes the test data.
 *   npm run test:e2e                      (API at http://localhost:5000/api)
 *   E2E_API_URL=https://... npm run test:e2e
 *   npm run test:e2e -- --keep            (keep the created data for inspection)
 */
import { assertSafeTarget, API, req } from './lib.mjs';
import { run as auth } from './auth.e2e.mjs';
import { run as fitness } from './fitness.e2e.mjs';
import { run as membership } from './membership.e2e.mjs';
import { cleanup } from './cleanup.mjs';

assertSafeTarget();
const health = await req('GET', '/health').catch(() => null);
if (!health || health.status !== 200) {
  console.error(`IronVault API is not reachable at ${API}. Start it with "npm run dev" first.`);
  process.exit(1);
}

console.log(`IronVault e2e suite → ${API}`);
const results = [];
for (const suite of [auth, fitness, membership]) {
  try {
    results.push(await suite());
  } catch (err) {
    console.error(err);
    results.push({ name: suite.name, pass: 0, fail: 1, failures: [`crashed: ${err.message}`] });
  }
}

if (!process.argv.includes('--keep')) {
  const removed = await cleanup();
  console.log(`\nCleaned up test data: ${JSON.stringify(removed)}`);
}

console.log('\nSummary');
let failed = 0;
for (const r of results) {
  failed += r.fail;
  console.log(`  ${r.fail ? '✗' : '✓'} ${r.name}: ${r.pass} passed, ${r.fail} failed`);
  r.failures.forEach((f) => console.log(`      - ${f}`));
}
const total = results.reduce((n, r) => n + r.pass + r.fail, 0);
console.log(`\n${total - failed}/${total} checks passed`);
process.exit(failed ? 1 : 0);
