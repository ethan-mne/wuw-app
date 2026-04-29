import { describe, expect, it, vi } from 'vitest';
import {
  authorizeOtpCredentials,
  isValidOtpCode,
  parseOTPCredentials,
} from './otp-auth';

describe('otp-auth', () => {
  it('rejects non-6-digit otp format before hitting db lookup', async () => {
    const otpModel = {
      findFirst: vi.fn(),
      update: vi.fn(),
    };

    const result = await authorizeOtpCredentials(
      {
        otpID: 'otp-id',
        otp: '12a456',
      },
      otpModel,
    );

    expect(result).toBeNull();
    expect(otpModel.findFirst).not.toHaveBeenCalled();
    expect(otpModel.update).not.toHaveBeenCalled();
  });

  it('accepts exactly 6 numeric digits', () => {
    expect(isValidOtpCode('123456')).toBe(true);
    expect(isValidOtpCode('12345')).toBe(false);
    expect(isValidOtpCode('1234567')).toBe(false);
    expect(isValidOtpCode('12345a')).toBe(false);
  });

  it('trims credentials and rejects missing values', () => {
    expect(
      parseOTPCredentials({
        otpID: '   ',
        otp: '123456',
      }),
    ).toBeNull();

    expect(
      parseOTPCredentials({
        otpID: ' otp-id ',
        otp: ' 123456 ',
      }),
    ).toEqual({
      otpID: 'otp-id',
      otp: '123456',
    });
  });
});
