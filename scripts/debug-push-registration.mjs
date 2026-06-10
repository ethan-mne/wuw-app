/**
 * Debug push token registration (production or local).
 *
 * Usage:
 *   node scripts/debug-push-registration.mjs --prod
 *   node scripts/debug-push-registration.mjs --prod --user-id=clv4yceam0001tfe7s6wfclio
 *   node scripts/debug-push-registration.mjs --prod --jwt=<mobile_session_jwt>
 *   node scripts/debug-push-registration.mjs --prod --jwt=<jwt> --probe-register
 *
 * JWT: in the installed app, DevTools → Application → localStorage → wuw_mobile_session_token
 *      (Chrome: connect phone USB → chrome://inspect → inspect WebView)
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

const useProd = process.argv.includes('--prod');
const PRODUCTION_API = 'https://wuw-backend.onrender.com';
const baseUrl = (
  readArg('base-url') ??
  process.env.DRAW_REMINDER_TEST_BASE_URL ??
  (useProd ? PRODUCTION_API : 'http://localhost:3000')
).replace(/\/$/, '');

const jwt = readArg('jwt') ?? process.env.MOBILE_SESSION_JWT;
const userId = readArg('user-id');
const probeRegister = process.argv.includes('--probe-register');

/** Shape accepted by server validation (not a real device). */
const PROBE_FCM_TOKEN =
  'debugProbe:APA91bDebugProbeToken123456789012345678901234567890123456789012345678901234';
const PROBE_APNS_TOKEN =
  'a9d0ed10e9cfd022a61cb08753f49c5a0b0dfb383697bf9f9d750a1003da19c7';

async function request(method, path, { body, bearer } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (bearer) {
    headers.Authorization = `Bearer ${bearer}`;
  }
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers,
    body: body != null ? JSON.stringify(body) : undefined,
  });
  const text = await response.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = text;
  }
  return { status: response.status, json };
}

function section(title) {
  console.log(`\n── ${title} ──`);
}

console.log(`API: ${baseUrl} (${useProd ? 'production' : 'local'})`);

section('1. Health / push transports');
const health = await request('GET', '/api/health');
console.log('GET /api/health →', health.status, JSON.stringify(health.json, null, 2));
if (health.json?.push?.pushConfigured === false) {
  console.log('⚠ Configure ONESIGNAL_APP_ID and ONESIGNAL_REST_API_KEY on Render.');
}
if (health.json?.push?.oneSignalConfigured === false) {
  console.log('⚠ OneSignal missing — draw reminder pushes will be skipped.');
}

section('2. Route push-token déployée ?');
const noAuth = await request('POST', '/api/mobile/v1/me/push-token', {
  body: { token: 'x', platform: 'android' },
});
console.log('POST push-token (token invalide) →', noAuth.status, JSON.stringify(noAuth.json));
if (noAuth.status === 404) {
  console.log('✗ Route absente — déployer le backend sur Render.');
  process.exit(1);
}
if (noAuth.status === 400) {
  console.log('✓ Route présente (validation Zod OK).');
}

const shapeNoAuth = await request('POST', '/api/mobile/v1/me/push-token', {
  body: { token: PROBE_FCM_TOKEN, platform: 'android' },
});
console.log('POST push-token (forme FCM valide, sans JWT) →', shapeNoAuth.status, JSON.stringify(shapeNoAuth.json));
if (shapeNoAuth.status === 401) {
  console.log('✓ Auth Bearer requise (normal).');
}

if (!jwt) {
  section('3. Session mobile (JWT)');
  console.log('Pas de --jwt= ni MOBILE_SESSION_JWT.');
  console.log('Sur téléphone (app installée, connecté) :');
  console.log('  • USB + chrome://inspect → WebView → Application → localStorage');
  console.log('  • Clé: wuw_mobile_session_token');
  console.log('Puis relancer:');
  console.log(
    `  node scripts/debug-push-registration.mjs --prod --jwt=<token> --user-id=${userId ?? '<cuid>'}`,
  );
} else {
  section('3. Ton compte — devices en base');
  const status = await request('GET', '/api/mobile/v1/me/push-token', { bearer: jwt });
  console.log('GET /api/mobile/v1/me/push-token →', status.status, JSON.stringify(status.json, null, 2));
  if (status.status === 200 && status.json?.data?.deviceCount === 0) {
    console.log('✗ Aucun token push enregistré pour ce JWT — l’app n’a pas réussi POST push-token.');
  } else if (status.status === 200 && status.json?.data?.deviceCount > 0) {
    console.log('✓ Token(s) présent(s) pour ce compte.');
  } else if (status.status === 401) {
    console.log('✗ JWT expiré ou invalide — reconnecte-toi dans l’app et recopie le token.');
  }

  if (probeRegister) {
    section('4. Test écriture (token sonde)');
    const reg = await request('POST', '/api/mobile/v1/me/push-token', {
      bearer: jwt,
      body: { token: PROBE_FCM_TOKEN, platform: 'android' },
    });
    console.log('POST push-token (sonde) →', reg.status, JSON.stringify(reg.json));
    if (reg.status === 200) {
      const again = await request('GET', '/api/mobile/v1/me/push-token', { bearer: jwt });
      console.log('GET après sonde →', again.status, JSON.stringify(again.json, null, 2));
      console.log(
        '✓ Backend + DB OK pour ton user. Si deviceCount=0 avant et 1 après, le blocage est côté app (FCM / permissions).',
      );
    }
  }
}

if (userId) {
  const secret = process.env.DRAW_REMINDER_CRON_SECRET ?? process.env.CRON_SECRET;
  if (!secret) {
    section('4. Draw reminder debug');
    console.log('SKIP: pas de CRON_SECRET dans .env');
  } else {
    section('4. Draw reminder debug (cron test)');
    const params = new URLSearchParams({
      test: 'true',
      debug: 'true',
      userId,
      force: 'true',
    });
    const compId = readArg('competition-id');
    if (compId) {
      params.set('competitionId', compId);
    }
    const cron = await fetch(`${baseUrl}/api/cron/draw-reminders?${params}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${secret}` },
    });
    const cronJson = await cron.json();
    const ut = cronJson?.result?.userTarget;
    console.log(JSON.stringify(ut ?? cronJson, null, 2));
    if (ut?.totalPushDevicesInDb === 0) {
      console.log('\n⚠ totalPushDevicesInDb=0 → PERSONNE n’a enregistré de push en prod.');
    }
  }
}

section('Checklist appareil');
console.log(`
1. Build récent : cd wuw-mobile && npm run android:release (ou ios:sync)
2. Notifications autorisées (Réglages → Winuwatch)
3. App native (pas navigateur) + connecté avec le même compte
4. Draws → Remind me (ou bannière « Enable notifications »)
5. Si message orange « Remind saved… » → push local a échoué, permissions / token
6. iOS: token en base = 64 hex (APNs). Android: token FCM avec « : ».
7. Revérifier : npm run draw-reminder:test:prod -- --user-id=... --debug
   → pushDeviceCount doit passer à 1
`);
