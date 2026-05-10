import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  db: {
    user: {
      upsert: vi.fn(),
    },
    referrals: {
      upsert: vi.fn(),
    },
    oTP: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      updateMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  },
  resendSend: vi.fn(),
  cookiesGet: vi.fn(),
  referralCode: vi.fn(),
}));

vi.mock('@/server/db', () => ({
  db: mocks.db,
}));

vi.mock('@/lib/resend', () => ({
  resend: {
    emails: {
      send: mocks.resendSend,
    },
  },
}));

vi.mock('next/headers', () => ({
  cookies: () => ({
    get: mocks.cookiesGet,
  }),
}));

vi.mock('@faker-js/faker', () => ({
  faker: {
    string: {
      alphanumeric: mocks.referralCode,
    },
  },
}));

vi.mock('@/components/emails/otpEmail', () => ({
  OTPEmail: () => null,
}));

import { sendOTPmail } from './send-otp-mail';

describe('sendOTPmail', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-02-21T12:00:00.000Z'));

    vi.clearAllMocks();

    mocks.db.user.upsert.mockResolvedValue({ id: 'user-1' });
    mocks.db.referrals.upsert.mockResolvedValue({ id: 'ref-1' });
    mocks.db.oTP.findFirst.mockResolvedValue(null);
    mocks.db.oTP.findMany.mockResolvedValue([]);
    mocks.db.oTP.updateMany.mockResolvedValue({ count: 0 });
    mocks.db.oTP.create.mockResolvedValue({ id: 'otp-1', otp: '123456' });
    mocks.db.oTP.update.mockResolvedValue({ id: 'otp-1' });
    mocks.resendSend.mockResolvedValue({ id: 'email-1' });
    mocks.cookiesGet.mockReturnValue(undefined);
    mocks.referralCode.mockReturnValue('ABCD1234');
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns invalid_email for malformed email and does not query db', async () => {
    const result = await sendOTPmail('invalid-email');

    expect(result).toEqual({
      status: 'error',
      code: 'invalid_email',
    });
    expect(mocks.db.user.upsert).not.toHaveBeenCalled();
    expect(mocks.db.oTP.create).not.toHaveBeenCalled();
  });

  it('returns rate_limited with retryAfterSeconds', async () => {
    mocks.db.oTP.findFirst.mockResolvedValue({
      id: 'otp-active',
      createdAt: new Date(Date.now() - 20 * 1000),
    });

    const result = await sendOTPmail('user@example.com');

    expect(result).toMatchObject({
      status: 'error',
      code: 'rate_limited',
    });
    expect(result.status).toBe('error');
    if (result.status !== 'error') {
      throw new Error('Expected rate_limited error');
    }
    expect(result.retryAfterSeconds).toBe(40);
    expect(mocks.db.oTP.create).not.toHaveBeenCalled();
    expect(mocks.resendSend).not.toHaveBeenCalled();
  });

  it('invalidates old active OTPs and keeps only latest old + new', async () => {
    mocks.db.oTP.findFirst.mockResolvedValue({
      id: 'otp-latest-old',
      createdAt: new Date(Date.now() - 70 * 1000),
    });
    mocks.db.oTP.findMany.mockResolvedValue([
      { id: 'otp-old-1' },
      { id: 'otp-old-2' },
    ]);

    const result = await sendOTPmail('user@example.com');

    expect(result).toEqual({
      status: 'sent',
      otpID: 'otp-1',
    });
    expect(mocks.db.oTP.updateMany).toHaveBeenCalledWith({
      where: {
        id: {
          in: ['otp-old-1', 'otp-old-2'],
        },
      },
      data: {
        used: true,
      },
    });
  });

  it('invalidates created otp when email provider fails', async () => {
    mocks.db.oTP.findFirst.mockResolvedValue({
      id: 'otp-latest-old',
      createdAt: new Date(Date.now() - 70 * 1000),
    });
    mocks.db.oTP.create.mockResolvedValue({
      id: 'otp-failed',
      otp: '654321',
    });
    mocks.resendSend.mockRejectedValue(new Error('provider-down'));

    const result = await sendOTPmail('user@example.com');

    expect(result).toEqual({
      status: 'error',
      code: 'unexpected',
    });
    expect(mocks.db.oTP.update).toHaveBeenCalledWith({
      where: { id: 'otp-failed' },
      data: { used: true },
    });
  });

  it('normalizes email and returns sent with otp id', async () => {
    mocks.cookiesGet.mockReturnValue({ value: 'utm-source' });

    const result = await sendOTPmail('  USER@Example.COM  ');

    expect(result).toEqual({
      status: 'sent',
      otpID: 'otp-1',
    });
    expect(mocks.db.user.upsert).toHaveBeenCalledWith({
      where: { email: 'user@example.com' },
      update: {},
      create: {
        email: 'user@example.com',
        utm: 'utm-source',
      },
      select: { id: true },
    });
    expect(mocks.resendSend).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'user@example.com',
      }),
    );
  });
});
