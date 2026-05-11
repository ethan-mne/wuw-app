import { createHmac, timingSafeEqual } from 'node:crypto';

import { env } from '@/env';

type TokenPayload = {
  sub: string;
  email: string | null;
  exp: number;
};

function base64urlJson(obj: unknown): string {
  return Buffer.from(JSON.stringify(obj), 'utf8').toString('base64url');
}

function parseBase64urlJson<T>(value: string): T | null {
  try {
    return JSON.parse(Buffer.from(value, 'base64url').toString('utf8')) as T;
  } catch {
    return null;
  }
}

export async function signMobileSessionToken(
  userId: string,
  email: string | null,
): Promise<string> {
  const exp = Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30;
  const payload: TokenPayload = { sub: userId, email, exp };
  const payloadPart = base64urlJson(payload);
  const sig = createHmac('sha256', env.NEXTAUTH_SECRET)
    .update(payloadPart)
    .digest('base64url');
  return `${payloadPart}.${sig}`;
}

export async function verifyMobileSessionToken(
  token: string,
): Promise<{ sub: string; email: string | null } | null> {
  const dot = token.lastIndexOf('.');
  if (dot <= 0) return null;
  const payloadPart = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const expected = createHmac('sha256', env.NEXTAUTH_SECRET)
    .update(payloadPart)
    .digest('base64url');

  const a = Buffer.from(sig, 'utf8');
  const b = Buffer.from(expected, 'utf8');
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return null;
  }

  const payload = parseBase64urlJson<TokenPayload>(payloadPart);
  if (!payload?.sub) return null;
  if (typeof payload.exp !== 'number' || payload.exp < Math.floor(Date.now() / 1000)) {
    return null;
  }

  return { sub: payload.sub, email: payload.email ?? null };
}
