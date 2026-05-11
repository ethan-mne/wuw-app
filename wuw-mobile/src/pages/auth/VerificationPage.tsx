import {
  type ClipboardEvent,
  type FormEvent,
  type KeyboardEvent,
  useRef,
  useState,
} from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

import { ActionLink, Card, PageHeader } from '../../components/ui';
import { setMobileSessionToken } from '../../lib/mobileSessionToken';
import { defaultLocale, isLocale, withLocale } from '../../routes/locales';
import { verifyMobileOtp } from '../../services/authApi';
import type { VerificationRouteState } from '../../types';

const OTP_LEN = 6;

export function VerificationPage() {
  const params = useParams();
  const locale = isLocale(params.locale) ? params.locale : defaultLocale;
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as VerificationRouteState | undefined;

  const [digits, setDigits] = useState<string[]>(() => Array(OTP_LEN).fill(''));
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  if (!state?.email || !state?.otpId) {
    return (
      <section className="page-stack page-content-pad">
        <PageHeader
          eyebrow="Verification"
          title="Start from login"
          description="Open the login page to request a verification code by email."
        />
        <Card>
          <ActionLink to={withLocale(locale, 'login')}>Go to login</ActionLink>
        </Card>
      </section>
    );
  }

  const setDigit = (index: number, value: string) => {
    const d = value.replace(/\D/g, '').slice(-1);
    const next = [...digits];
    next[index] = d;
    setDigits(next);
    if (d && index < OTP_LEN - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const onKeyDown = (index: number, event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Backspace' && !digits[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  const onPaste = (event: ClipboardEvent<HTMLInputElement>) => {
    event.preventDefault();
    const text = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LEN);
    if (!text) return;
    const next = [...digits];
    for (let i = 0; i < OTP_LEN; i++) {
      next[i] = text[i] ?? '';
    }
    setDigits(next);
    const focusIdx = Math.min(text.length, OTP_LEN - 1);
    inputsRef.current[focusIdx]?.focus();
  };

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setFormError('');
    const otp = digits.join('');
    if (otp.length !== OTP_LEN) return;

    setSubmitting(true);
    const result = await verifyMobileOtp(state.otpId, otp);
    setSubmitting(false);

    if (result.status === 'ok') {
      setMobileSessionToken(result.token);
      void navigate(withLocale(locale, 'account/dashboard'));
      return;
    }

    if (result.status === 'invalid_code') {
      setFormError('Invalid or expired code. Request a new code from login.');
      return;
    }

    setFormError('Something went wrong. Please try again.');
  };

  const code = digits.join('');
  const canSubmit = code.length === OTP_LEN && !submitting;

  return (
    <section className="page-stack page-content-pad">
      <PageHeader
        eyebrow="Verification"
        title="Enter your code"
        description={`We sent a 6-digit code to ${state.email}.`}
      />
      <Card>
        <form className="verification-form" onSubmit={onSubmit}>
          <div className="otp-row otp-row--six" role="group" aria-label="One-time password">
            {digits.map((d, i) => (
              <input
                key={i}
                ref={(el) => {
                  inputsRef.current[i] = el;
                }}
                aria-label={`Digit ${i + 1} of ${OTP_LEN}`}
                autoComplete={i === 0 ? 'one-time-code' : 'off'}
                className="otp-cell text-field"
                disabled={submitting}
                inputMode="numeric"
                maxLength={1}
                type="text"
                value={d}
                onChange={(event) => setDigit(i, event.target.value)}
                onKeyDown={(event) => onKeyDown(i, event)}
                onPaste={onPaste}
              />
            ))}
          </div>
          {formError ? (
            <div className="checkout-flow-errors" aria-live="polite">
              <p>{formError}</p>
            </div>
          ) : null}
          <button className="action-link primary" disabled={!canSubmit} type="submit">
            {submitting ? 'Verifying…' : 'Continue'}
          </button>
        </form>
        <ActionLink variant="secondary" to={withLocale(locale, 'login')}>
          Use a different email
        </ActionLink>
      </Card>
    </section>
  );
}
