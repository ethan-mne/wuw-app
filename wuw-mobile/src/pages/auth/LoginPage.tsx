import { type FormEvent, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { ActionLink, Card, PageHeader } from '../../components/ui';
import { defaultLocale, isLocale, withLocale } from '../../routes/locales';
import { sendLoginOtp, type SendLoginOtpOutcome } from '../../services/authApi';
import { setMobileSessionToken } from '../../lib/mobileSessionToken';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function outcomeToMessage(outcome: SendLoginOtpOutcome): string {
  if (outcome.status === 'client_error') {
    switch (outcome.code) {
      case 'missing_api_url':
        return 'Cannot connect: API URL is not configured.';
      case 'network':
        return 'Network error. Check your connection and try again.';
      case 'bad_response':
        return 'Something went wrong. Please try again.';
    }
  }
  if (outcome.status === 'error') {
    switch (outcome.code) {
      case 'invalid_email':
        return 'Enter a valid email address.';
      case 'rate_limited':
        return outcome.retryAfterSeconds
          ? `Please wait ${outcome.retryAfterSeconds} seconds before requesting a new code.`
          : 'Please wait a moment before requesting a new code.';
      case 'unexpected':
        return 'Something went wrong. Please try again.';
    }
  }
  return '';
}

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const params = useParams();
  const navigate = useNavigate();
  const locale = isLocale(params.locale) ? params.locale : defaultLocale;

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setFormError('');

    const normalized = normalizeEmail(email);
    if (!normalized || !EMAIL_PATTERN.test(normalized)) {
      setFormError('Enter a valid email address.');
      return;
    }

    setSubmitting(true);
    const outcome = await sendLoginOtp(normalized);
    setSubmitting(false);

    if (outcome.status === 'sent') {
      setMobileSessionToken(null);
      void navigate(withLocale(locale, 'verification'), {
        state: { email: normalized, otpId: outcome.otpID },
      });
      return;
    }

    setFormError(outcomeToMessage(outcome));
  };

  return (
    <section className="page-stack page-content-pad">
      <PageHeader
        eyebrow="Login"
        title="Sign in with email"
        description="We will email you a one-time code to verify it is you."
      />
      <Card>
        <form className="login-form" onSubmit={onSubmit}>
          <label className="field-label" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            autoComplete="email"
            className="text-field"
            disabled={submitting}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            type="email"
            value={email}
          />
          {formError ? (
            <div className="checkout-flow-errors" aria-live="polite">
              <p>{formError}</p>
            </div>
          ) : null}
          <button className="action-link primary" disabled={submitting} type="submit">
            {submitting ? 'Sending…' : 'Send code'}
          </button>
        </form>
        <ActionLink variant="secondary" to={withLocale(locale)}>
          Back to home
        </ActionLink>
      </Card>
    </section>
  );
}
