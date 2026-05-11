import { API_BASE_URL } from '../lib/config';

/** Mirrors server `SendOTPResult` from send-otp-mail.ts */
export type SendOTPResult =
  | { status: 'sent'; otpID: string }
  | {
      status: 'error';
      code: 'invalid_email' | 'rate_limited' | 'unexpected';
      retryAfterSeconds?: number;
    };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function parseSendOtpPayload(json: unknown): SendOTPResult | null {
  if (!isRecord(json)) return null;
  if (json.status === 'sent' && typeof json.otpID === 'string') {
    return { status: 'sent', otpID: json.otpID };
  }
  if (json.status === 'error' && typeof json.code === 'string') {
    const code = json.code;
    if (
      code === 'invalid_email' ||
      code === 'rate_limited' ||
      code === 'unexpected'
    ) {
      const retry =
        typeof json.retryAfterSeconds === 'number' ? json.retryAfterSeconds : undefined;
      return { status: 'error', code, retryAfterSeconds: retry };
    }
  }
  return null;
}

export type SendLoginOtpOutcome =
  | SendOTPResult
  | { status: 'client_error'; code: 'missing_api_url' | 'network' | 'bad_response' };

export async function sendLoginOtp(email: string): Promise<SendLoginOtpOutcome> {
  if (!API_BASE_URL) {
    return { status: 'client_error', code: 'missing_api_url' };
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/api/mobile/v1/auth/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
  } catch {
    return { status: 'client_error', code: 'network' };
  }

  let json: unknown;
  try {
    json = await response.json();
  } catch {
    return { status: 'client_error', code: 'bad_response' };
  }

  if (!response.ok) {
    return { status: 'client_error', code: 'bad_response' };
  }

  const parsed = parseSendOtpPayload(json);
  if (!parsed) {
    return { status: 'client_error', code: 'bad_response' };
  }

  return parsed;
}

export type VerifyOtpOutcome =
  | { status: 'ok'; token: string }
  | { status: 'invalid_code' }
  | { status: 'client_error'; code: 'missing_api_url' | 'network' | 'bad_response' };

export async function verifyMobileOtp(
  otpId: string,
  otp: string,
): Promise<VerifyOtpOutcome> {
  if (!API_BASE_URL) {
    return { status: 'client_error', code: 'missing_api_url' };
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/api/mobile/v1/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ otpId, otp }),
    });
  } catch {
    return { status: 'client_error', code: 'network' };
  }

  let json: unknown;
  try {
    json = await response.json();
  } catch {
    json = null;
  }

  if (response.status === 401) {
    return { status: 'invalid_code' };
  }

  if (!response.ok) {
    return { status: 'client_error', code: 'bad_response' };
  }

  if (!isRecord(json) || typeof json.token !== 'string' || !json.token) {
    return { status: 'client_error', code: 'bad_response' };
  }

  return { status: 'ok', token: json.token };
}