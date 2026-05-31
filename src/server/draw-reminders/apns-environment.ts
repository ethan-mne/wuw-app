export type ApnsEnvironment = 'sandbox' | 'production';

export function getDefaultApnsEnvironment(): ApnsEnvironment {
  const raw = process.env.APNS_PRODUCTION?.trim().toLowerCase();
  if (raw === 'false' || raw === '0') {
    return 'sandbox';
  }
  return 'production';
}

export function alternateApnsEnvironment(environment: ApnsEnvironment): ApnsEnvironment {
  return environment === 'production' ? 'sandbox' : 'production';
}

/** APNs rejects tokens on the wrong host, or wrong host rejects our provider JWT. */
export function isApnsEnvironmentMismatch(errorCode: string | undefined): boolean {
  return errorCode === 'BadEnvironmentKeyInToken' || errorCode === 'InvalidProviderToken';
}

/** Accept single-line (\\n escaped) or multi-line PEM from hosting env UIs. */
export function normalizeP8Key(raw: string): string {
  let key = raw.trim();
  if (
    (key.startsWith('"') && key.endsWith('"')) ||
    (key.startsWith("'") && key.endsWith("'"))
  ) {
    key = key.slice(1, -1);
  }
  if (key.includes('\\n')) {
    key = key.replace(/\\n/g, '\n');
  }
  return key
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .join('\n');
}
