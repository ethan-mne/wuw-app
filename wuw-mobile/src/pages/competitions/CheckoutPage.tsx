import { type FormEvent, type ReactNode, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

import { SafeImage } from '../../components/SafeImage';
import { Card } from '../../components/ui';
import { INFORMATIVE_ONLY_MODE } from '../../config/informativeOnlyMode';
import { formatDrawDateDdMmYyyy } from '../../lib/formatDrawDate';
import { formatGbp } from '../../lib/formatCurrency';
import { resolveMediaUrl } from '../../lib/resolveMediaUrl';
import { defaultLocale, isLocale, withLocale } from '../../routes/locales';
import { getMobileSessionToken } from '../../lib/mobileSessionToken';
import { mobileDataService } from '../../services/mobileDataService';
import type { Competition, MobileUserProfile } from '../../types';
import { CHECKOUT_FLOW_DEFAULTS, type CheckoutFlowState } from './checkoutFlow';

type CheckoutFormState = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  postalCode: string;
  confirmAge: boolean;
  acceptTerms: boolean;
  receiveUpdates: boolean;
};

const INITIAL_FORM: CheckoutFormState = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  address: '',
  city: '',
  country: '',
  postalCode: '',
  confirmAge: false,
  acceptTerms: false,
  receiveUpdates: false,
};

type CheckoutFieldErrors = Partial<Record<keyof CheckoutFormState, string>>;

function CheckoutFormField({
  error,
  children,
}: {
  error?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={`checkout-form-field${error ? ' checkout-form-field--error' : ''}`}
    >
      {children}
      {error ? (
        <p className="checkout-form-field-error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function mergeProfileIntoCheckoutForm(
  prev: CheckoutFormState,
  profile: MobileUserProfile,
): CheckoutFormState {
  const coalesce = (existing: string, fromProfile: string | null | undefined) =>
    existing.trim() ||
    (typeof fromProfile === 'string' ? fromProfile.trim() : '') ||
    '';

  return {
    ...prev,
    firstName: coalesce(prev.firstName, profile.firstName),
    lastName: coalesce(prev.lastName, profile.lastName),
    email: coalesce(prev.email, profile.email),
    phone: coalesce(prev.phone, profile.phone),
    address: coalesce(prev.address, profile.address),
    city: coalesce(prev.city, profile.city),
    country: coalesce(prev.country, profile.country),
    postalCode: coalesce(prev.postalCode, profile.zipCode),
  };
}

export function CheckoutPage() {
  const [form, setForm] = useState<CheckoutFormState>(INITIAL_FORM);
  const [fieldErrors, setFieldErrors] = useState<CheckoutFieldErrors>({});
  const [competition, setCompetition] = useState<Competition>();
  const [loading, setLoading] = useState(true);
  const params = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const locale = isLocale(params.locale) ? params.locale : defaultLocale;
  const flowState = (location.state as CheckoutFlowState | undefined) ?? CHECKOUT_FLOW_DEFAULTS;
  const quantity = Math.max(1, flowState.quantity ?? 1);
  const discountPercent = Math.max(0, flowState.discountPercent ?? 0);

  useEffect(() => {
    if (!INFORMATIVE_ONLY_MODE) return;
    const id = params.id;
    const target =
      id !== undefined && id !== ''
        ? withLocale(locale, `competitions/${id}`)
        : withLocale(locale, '');
    navigate(target, { replace: true });
  }, [locale, navigate, params.id]);

  useEffect(() => {
    if (INFORMATIVE_ONLY_MODE) return;
    void mobileDataService
      .getCompetition(params.id)
      .then((data) => {
        setCompetition(data);
        setLoading(false);
      })
      .catch(() => {
        setCompetition(undefined);
        setLoading(false);
      });
  }, [params.id]);

  useEffect(() => {
    if (INFORMATIVE_ONLY_MODE) return;
    if (!getMobileSessionToken()) {
      return;
    }
    void mobileDataService.loadMobileProfile().then((result) => {
      if (result.kind !== 'ok') {
        return;
      }
      setForm((prev) => mergeProfileIntoCheckoutForm(prev, result.data));
    });
  }, []);

  const discountedTicketPrice = useMemo(
    () => (competition?.ticketPrice ?? 0) * (1 - discountPercent / 100),
    [competition?.ticketPrice, discountPercent],
  );
  const total = useMemo(() => discountedTicketPrice * quantity, [discountedTicketPrice, quantity]);

  const watchDisplayName = useMemo(
    () =>
      competition ? `${competition.watch.brand} ${competition.watch.model}`.trim() : '',
    [competition],
  );

  const summaryImageSrc = useMemo(() => {
    if (!competition) {
      return '';
    }
    const hero = competition.competitionImageUrl?.trim();
    if (hero) {
      return resolveMediaUrl(hero);
    }
    return resolveMediaUrl(competition.watch.images[0]?.url);
  }, [competition]);

  const onFieldChange = (key: keyof CheckoutFormState, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setFieldErrors((prev) => {
      if (prev[key] == null) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const validate = (): CheckoutFieldErrors => {
    const next: CheckoutFieldErrors = {};
    if (!form.firstName.trim()) next.firstName = 'First name is required.';
    if (!form.lastName.trim()) next.lastName = 'Last name is required.';
    if (!form.email.trim() || !form.email.includes('@')) {
      next.email = 'A valid email is required.';
    }
    if (!form.phone.trim()) next.phone = 'Phone is required.';
    if (!form.address.trim()) next.address = 'Address is required.';
    if (!form.city.trim()) next.city = 'City is required.';
    if (!form.country.trim()) next.country = 'Country is required.';
    if (!form.postalCode.trim()) next.postalCode = 'Zip / postal code is required.';
    if (!form.confirmAge) next.confirmAge = 'You must confirm age 18+.';
    if (!form.acceptTerms)
      next.acceptTerms = 'You must accept terms and refund policy.';
    return next;
  };

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors = validate();
    setFieldErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0 || !competition) {
      return;
    }

    const nextPath = withLocale(
      locale,
      `competitions/${competition.id}/${params.orderId ?? 'draft-order'}/confirmation`,
    );
    navigate(nextPath, {
      state: {
        quantity,
        answer: flowState.answer,
        discountPercent,
        timedOut: flowState.timedOut,
      } satisfies CheckoutFlowState,
    });
  };

  if (loading) {
    return (
      <div className="home-competitions-loading" role="status" aria-live="polite">
        <span className="home-competitions-loading-spinner" aria-hidden />
        <span className="sr-only">Loading checkout</span>
      </div>
    );
  }

  if (!competition) {
    return (
      <Card>
        <h2>Checkout unavailable</h2>
        <button
          type="button"
          className="checkout-flow-button"
          onClick={() => navigate(withLocale(locale, ''))}
        >
          Back to home
        </button>
      </Card>
    );
  }

  return (
    <section className="checkout-flow-page">
      <Card>
        <div className="checkout-flow-eyebrow">Checkout</div>
        <h2 className="checkout-flow-title">Billing information</h2>
        <p className="checkout-flow-question-subtitle">
          Confirmation email will be sent after checkout.
        </p>

        <form className="checkout-form" onSubmit={onSubmit}>
          <div className="checkout-form-grid">
            <CheckoutFormField error={fieldErrors.firstName}>
              <label htmlFor="checkout-first-name">
                <span>First name</span>
                <input
                  id="checkout-first-name"
                  aria-invalid={Boolean(fieldErrors.firstName)}
                  value={form.firstName}
                  onChange={(event) => onFieldChange('firstName', event.target.value)}
                />
              </label>
            </CheckoutFormField>
            <CheckoutFormField error={fieldErrors.lastName}>
              <label htmlFor="checkout-last-name">
                <span>Last name</span>
                <input
                  id="checkout-last-name"
                  aria-invalid={Boolean(fieldErrors.lastName)}
                  value={form.lastName}
                  onChange={(event) => onFieldChange('lastName', event.target.value)}
                />
              </label>
            </CheckoutFormField>
            <CheckoutFormField error={fieldErrors.email}>
              <label htmlFor="checkout-email">
                <span>Email</span>
                <input
                  id="checkout-email"
                  type="email"
                  aria-invalid={Boolean(fieldErrors.email)}
                  autoComplete="email"
                  value={form.email}
                  onChange={(event) => onFieldChange('email', event.target.value)}
                />
              </label>
            </CheckoutFormField>
            <CheckoutFormField error={fieldErrors.phone}>
              <label htmlFor="checkout-phone">
                <span>Phone</span>
                <input
                  id="checkout-phone"
                  aria-invalid={Boolean(fieldErrors.phone)}
                  autoComplete="tel"
                  value={form.phone}
                  onChange={(event) => onFieldChange('phone', event.target.value)}
                />
              </label>
            </CheckoutFormField>
            <CheckoutFormField error={fieldErrors.address}>
              <label htmlFor="checkout-address">
                <span>Address</span>
                <input
                  id="checkout-address"
                  aria-invalid={Boolean(fieldErrors.address)}
                  autoComplete="street-address"
                  value={form.address}
                  onChange={(event) => onFieldChange('address', event.target.value)}
                />
              </label>
            </CheckoutFormField>
            <CheckoutFormField error={fieldErrors.city}>
              <label htmlFor="checkout-city">
                <span>City</span>
                <input
                  id="checkout-city"
                  aria-invalid={Boolean(fieldErrors.city)}
                  autoComplete="address-level2"
                  value={form.city}
                  onChange={(event) => onFieldChange('city', event.target.value)}
                />
              </label>
            </CheckoutFormField>
            <CheckoutFormField error={fieldErrors.country}>
              <label htmlFor="checkout-country">
                <span>Country</span>
                <input
                  id="checkout-country"
                  aria-invalid={Boolean(fieldErrors.country)}
                  autoComplete="country-name"
                  value={form.country}
                  onChange={(event) => onFieldChange('country', event.target.value)}
                />
              </label>
            </CheckoutFormField>
            <CheckoutFormField error={fieldErrors.postalCode}>
              <label htmlFor="checkout-postal-code">
                <span>Zip / Postal code</span>
                <input
                  id="checkout-postal-code"
                  aria-invalid={Boolean(fieldErrors.postalCode)}
                  autoComplete="postal-code"
                  value={form.postalCode}
                  onChange={(event) => onFieldChange('postalCode', event.target.value)}
                />
              </label>
            </CheckoutFormField>
          </div>

          <div className="checkout-order-summary">
            <h3>Order summary</h3>
            {summaryImageSrc ? (
              <SafeImage
                src={summaryImageSrc}
                alt={watchDisplayName || competition.name}
                className="checkout-order-summary-image"
              />
            ) : null}
            <p>{competition.name}</p>
            <dl>
              <div>
                <dt>Draw date</dt>
                <dd>{formatDrawDateDdMmYyyy(competition.endDate)}</dd>
              </div>
              <div>
                <dt>Ticket quantity</dt>
                <dd>{quantity}</dd>
              </div>
              <div>
                <dt>Ticket price</dt>
                <dd>
                  {discountPercent > 0 ? (
                    <>
                      {formatGbp(discountedTicketPrice)} ({discountPercent}% off)
                    </>
                  ) : (
                    formatGbp(competition.ticketPrice)
                  )}
                </dd>
              </div>
              <div>
                <dt>Total</dt>
                <dd>{formatGbp(total)}</dd>
              </div>
            </dl>
            {flowState.timedOut ? (
              <p className="checkout-flow-warning">
                Timer elapsed during challenge. Your order still proceeds.
              </p>
            ) : null}
          </div>

          <div className="checkout-form-checks">
            <div
              className={`checkout-form-check${fieldErrors.confirmAge ? ' checkout-form-check--error' : ''}`}
            >
              <label htmlFor="checkout-confirm-age">
                <input
                  id="checkout-confirm-age"
                  type="checkbox"
                  aria-invalid={Boolean(fieldErrors.confirmAge)}
                  checked={form.confirmAge}
                  onChange={(event) => onFieldChange('confirmAge', event.target.checked)}
                />
                <span>I confirm that I am at least 18 years old.</span>
              </label>
              {fieldErrors.confirmAge ? (
                <p className="checkout-form-field-error" role="alert">
                  {fieldErrors.confirmAge}
                </p>
              ) : null}
            </div>
            <div
              className={`checkout-form-check${fieldErrors.acceptTerms ? ' checkout-form-check--error' : ''}`}
            >
              <label htmlFor="checkout-accept-terms">
                <input
                  id="checkout-accept-terms"
                  type="checkbox"
                  aria-invalid={Boolean(fieldErrors.acceptTerms)}
                  checked={form.acceptTerms}
                  onChange={(event) => onFieldChange('acceptTerms', event.target.checked)}
                />
                <span>I accept the terms and refund policy.</span>
              </label>
              {fieldErrors.acceptTerms ? (
                <p className="checkout-form-field-error" role="alert">
                  {fieldErrors.acceptTerms}
                </p>
              ) : null}
            </div>
            <label htmlFor="checkout-receive-updates">
              <input
                id="checkout-receive-updates"
                type="checkbox"
                checked={form.receiveUpdates}
                onChange={(event) => onFieldChange('receiveUpdates', event.target.checked)}
              />
              <span>I agree to receive email updates and news.</span>
            </label>
          </div>

          <button type="submit" className="checkout-flow-button">
            Proceed to check out
          </button>
        </form>

        <div className="checkout-flow-secondary-actions">
          <button
            type="button"
            className="checkout-flow-button checkout-flow-button--ghost"
            onClick={() => navigate(withLocale(locale, `competitions/${competition.id}`))}
          >
            Back to competition
          </button>
        </div>
      </Card>
    </section>
  );
}
