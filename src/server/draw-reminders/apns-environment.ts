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

/** APNs rejects tokens on the wrong host (sandbox token → production host, etc.). */
export function isApnsEnvironmentMismatch(errorCode: string | undefined): boolean {
  return errorCode === 'BadEnvironmentKeyInToken';
}
