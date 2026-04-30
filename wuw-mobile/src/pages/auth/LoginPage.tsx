import { useState } from 'react';
import { useParams } from 'react-router-dom';

import { ActionLink, Card, PageHeader } from '../../components/ui';
import { defaultLocale, isLocale, withLocale } from '../../routes/locales';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const params = useParams();
  const locale = isLocale(params.locale) ? params.locale : defaultLocale;

  return (
    <section className="page-stack">
      <PageHeader
        eyebrow="Login"
        title="Sign in with email"
        description="Faithful mobile placeholder for the web OTP login flow."
      />
      <Card>
        <label className="field-label" htmlFor="email">
          Email
        </label>
        <input
          id="email"
          className="text-field"
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@example.com"
          type="email"
          value={email}
        />
        <ActionLink to={withLocale(locale, 'verification')}>
          Continue to verification
        </ActionLink>
      </Card>
    </section>
  );
}
