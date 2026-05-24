/**
 * Trigger draw-reminder push notifications for local testing.
 *
 * Usage:
 *   node scripts/trigger-draw-reminder-test.mjs
 *   node scripts/trigger-draw-reminder-test.mjs --competition-id=cmog47d1q001y8cbex7z3mc8z
 *   node scripts/trigger-draw-reminder-test.mjs --user-id=<cuid>
 *   node scripts/trigger-draw-reminder-test.mjs --record-sent
 *   node scripts/trigger-draw-reminder-test.mjs --debug
 *   node scripts/trigger-draw-reminder-test.mjs --user-id=<cuid>   # push token only, no ticket/alert required
 *   node scripts/trigger-draw-reminder-test.mjs --prod --competition-id=... --user-id=...
 *
 * Requires in .env: CRON_SECRET or DRAW_REMINDER_CRON_SECRET (must match the target environment)
 * Production: deploy latest backend, then use --prod (hits /api/cron/draw-reminders?test=true)
 * Optional: --base-url=... or DRAW_REMINDER_TEST_BASE_URL (overrides --prod default)
 */

import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

function loadEnvFile() {
  const envPath = resolve(process.cwd(), '.env');
  if (!existsSync(envPath)) {
    return;
  }
  const text = readFileSync(envPath, 'utf8');
  for (const line of text.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }
    const eq = trimmed.indexOf('=');
    if (eq <= 0) {
      continue;
    }
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] == null) {
      process.env[key] = value;
    }
  }
}

function readArg(name) {
  const prefix = `--${name}=`;
  const hit = process.argv.find((a) => a.startsWith(prefix));
  return hit ? hit.slice(prefix.length) : undefined;
}

loadEnvFile();

const secret =
  process.env.DRAW_REMINDER_CRON_SECRET ?? process.env.CRON_SECRET;
if (!secret) {
  console.error('Missing CRON_SECRET or DRAW_REMINDER_CRON_SECRET in .env');
  process.exit(1);
}

const useProd = process.argv.includes('--prod');
/** Mobile app production API (see wuw-mobile/.env.production). */
const PRODUCTION_API_DEFAULT = 'https://wuw-backend.onrender.com';
const defaultBaseUrl = useProd
  ? (process.env.DRAW_REMINDER_PROD_BASE_URL ?? PRODUCTION_API_DEFAULT)
  : 'http://localhost:3000';

const baseUrl = (
  readArg('base-url') ??
  process.env.DRAW_REMINDER_TEST_BASE_URL ??
  defaultBaseUrl
).replace(/\/$/, '');

const params = new URLSearchParams({ test: 'true' });
const competitionId = readArg('competition-id');
const userId = readArg('user-id');
if (competitionId) {
  params.set('competitionId', competitionId);
}
if (userId) {
  params.set('userId', userId);
}
if (process.argv.includes('--no-force')) {
  params.set('force', 'false');
}
if (process.argv.includes('--respect-sent')) {
  params.set('skipAlreadySent', 'false');
}
if (process.argv.includes('--record-sent')) {
  params.set('recordSent', 'true');
}
if (process.argv.includes('--debug')) {
  params.set('debug', 'true');
}

const url = `${baseUrl}/api/cron/draw-reminders?${params.toString()}`;

console.log(`Target: ${useProd ? 'production' : 'local'} (${baseUrl})`);
console.log(`POST ${url}`);

const response = await fetch(url, {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${secret}`,
  },
});

const body = await response.text();
let json;
try {
  json = JSON.parse(body);
} catch {
  json = body;
}

if (!response.ok) {
  console.error('Request failed:', response.status);
  if (typeof json === 'string' && json.includes('<!DOCTYPE html>')) {
    console.error(
      'Got an HTML page instead of JSON. The test route may not be deployed yet, or the URL is wrong.',
    );
    console.error('Deploy latest backend to Render, then retry with --prod.');
  } else {
    console.error(json);
  }
  process.exit(1);
}

console.log(JSON.stringify(json, null, 2));
