import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  env: { DEMO_AUTH_ENABLED: 'true' as string },
  db: {
    user: { upsert: vi.fn() },
    referrals: { upsert: vi.fn() },
  },
  signMobileSessionToken: vi.fn(),
  cookies: vi.fn(),
}));

vi.mock('@/env', () => ({
  env: mocks.env,
}));

vi.mock('@/server/db', () => ({
  db: mocks.db,
}));

vi.mock('@/server/mobile/mobile-session-token', () => ({
  signMobileSessionToken: mocks.signMobileSessionToken,
}));

vi.mock('next/headers', () => ({
  cookies: mocks.cookies,
}));

import { loginWithDemoEmail } from './demo-login';

describe('loginWithDemoEmail', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.env.DEMO_AUTH_ENABLED = 'true';
    mocks.cookies.mockReturnValue({ get: () => undefined });
    mocks.db.user.upsert.mockResolvedValue({
      id: 'user-1',
      email: 'demo@example.com',
    });
    mocks.db.referrals.upsert.mockResolvedValue({});
    mocks.signMobileSessionToken.mockResolvedValue('signed-token');
  });

  it('returns disabled when demo auth is off', async () => {
    mocks.env.DEMO_AUTH_ENABLED = 'false';

    const result = await loginWithDemoEmail('demo@example.com');

    expect(result).toEqual({ status: 'error', code: 'disabled' });
    expect(mocks.db.user.upsert).not.toHaveBeenCalled();
  });

  it('returns invalid_email for bad input', async () => {
    const result = await loginWithDemoEmail('not-an-email');

    expect(result).toEqual({ status: 'error', code: 'invalid_email' });
    expect(mocks.db.user.upsert).not.toHaveBeenCalled();
  });

  it('creates user and returns token when enabled', async () => {
    const result = await loginWithDemoEmail('  Demo@Example.COM  ');

    expect(result).toEqual({ status: 'ok', token: 'signed-token' });
    expect(mocks.db.user.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { email: 'demo@example.com' },
      }),
    );
    expect(mocks.signMobileSessionToken).toHaveBeenCalledWith('user-1', 'demo@example.com');
  });
});
