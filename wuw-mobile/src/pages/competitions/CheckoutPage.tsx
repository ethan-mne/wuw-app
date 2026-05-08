import { type FormEvent, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

import { Card } from '../../components/ui';
import { formatDrawDateDdMmYyyy } from '../../lib/formatDrawDate';
import { defaultLocale, isLocale, withLocale } from '../../routes/locales';
import { mobileDataService } from '../../services/mobileDataService';
import type { Competition } from '../../types';
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

export function CheckoutPage() {
  const [form, setForm] = useState<CheckoutFormState>(INITIAL_FORM);
  const [errors, setErrors] = useState<string[]>([]);
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

  const discountedTicketPrice = useMemo(
    () => (competition?.ticketPrice ?? 0) * (1 - discountPercent / 100),
    [competition?.ticketPrice, discountPercent],
  );
  const total = useMemo(() => discountedTicketPrice * quantity, [discountedTicketPrice, quantity]);

  const onFieldChange = (key: keyof CheckoutFormState, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const validate = (): string[] => {
    const nextErrors: string[] = [];
    if (!form.firstName.trim()) nextErrors.push('First name is required.');
    if (!form.lastName.trim()) nextErrors.push('Last name is required.');
    if (!form.email.trim() || !form.email.includes('@'))
      nextErrors.push('A valid email is required.');
    if (!form.phone.trim()) nextErrors.push('Phone is required.');
    if (!form.address.trim()) nextErrors.push('Address is required.');
    if (!form.city.trim()) nextErrors.push('City is required.');
    if (!form.country.trim()) nextErrors.push('Country is required.');
    if (!form.postalCode.trim()) nextErrors.push('Zip / postal code is required.');
    if (!form.confirmAge) nextErrors.push('You must confirm age 18+.');
    if (!form.acceptTerms) nextErrors.push('You must accept terms and refund policy.');
    return nextErrors;
  };

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors = validate();
    setErrors(nextErrors);
    if (nextErrors.length > 0 || !competition) {
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
    return <p>Loading checkout...</p>;
  }

  if (!competition) {
    return (
      <Card>
        <h2>Checkout unavailable</h2>
        <button
          type="button"
          className="checkout-flow-button"
          onClick={() => navigate(withLocale(locale, 'competitions'))}
        >
          Back to competitions
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
            <label>
              <span>First name</span>
              <input
                value={form.firstName}
                onChange={(event) => onFieldChange('firstName', event.target.value)}
              />
            </label>
            <label>
              <span>Last name</span>
              <input
                value={form.lastName}
                onChange={(event) => onFieldChange('lastName', event.target.value)}
              />
            </label>
            <label>
              <span>Email</span>
              <input
                type="email"
                value={form.email}
                onChange={(event) => onFieldChange('email', event.target.value)}
              />
            </label>
            <label>
              <span>Phone</span>
              <input
                value={form.phone}
                onChange={(event) => onFieldChange('phone', event.target.value)}
              />
            </label>
            <label>
              <span>Address</span>
              <input
                value={form.address}
                onChange={(event) => onFieldChange('address', event.target.value)}
              />
            </label>
            <label>
              <span>City</span>
              <input
                value={form.city}
                onChange={(event) => onFieldChange('city', event.target.value)}
              />
            </label>
            <label>
              <span>Country</span>
              <input
                value={form.country}
                onChange={(event) => onFieldChange('country', event.target.value)}
              />
            </label>
            <label>
              <span>Zip / Postal code</span>
              <input
                value={form.postalCode}
                onChange={(event) => onFieldChange('postalCode', event.target.value)}
              />
            </label>
          </div>

          <div className="checkout-order-summary">
            <h3>Order summary</h3>
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
                      GBP {discountedTicketPrice.toFixed(2)} ({discountPercent}% off)
                    </>
                  ) : (
                    <>GBP {competition.ticketPrice.toFixed(2)}</>
                  )}
                </dd>
              </div>
              <div>
                <dt>Total</dt>
                <dd>GBP {total.toFixed(2)}</dd>
              </div>
              <div>
                <dt>Challenge answer</dt>
                <dd>{flowState.answer ?? 'Not answered'}</dd>
              </div>
            </dl>
            {flowState.timedOut ? (
              <p className="checkout-flow-warning">
                Timer elapsed during challenge. Your order still proceeds.
              </p>
            ) : null}
          </div>

          <div className="checkout-form-checks">
            <label>
              <input
                type="checkbox"
                checked={form.confirmAge}
                onChange={(event) => onFieldChange('confirmAge', event.target.checked)}
              />
              <span>I confirm that I am at least 18 years old.</span>
            </label>
            <label>
              <input
                type="checkbox"
                checked={form.acceptTerms}
                onChange={(event) => onFieldChange('acceptTerms', event.target.checked)}
              />
              <span>I accept the terms and refund policy.</span>
            </label>
            <label>
              <input
                type="checkbox"
                checked={form.receiveUpdates}
                onChange={(event) => onFieldChange('receiveUpdates', event.target.checked)}
              />
              <span>I agree to receive email updates and news.</span>
            </label>
          </div>

          {errors.length > 0 ? (
            <div className="checkout-flow-errors" aria-live="polite">
              {errors.map((error) => (
                <p key={error}>{error}</p>
              ))}
            </div>
          ) : null}

          <button type="submit" className="checkout-flow-button">
            Proceed to check out
          </button>
        </form>

        <div className="checkout-flow-secondary-actions">
          <button
            type="button"
            className="checkout-flow-button checkout-flow-button--light"
            onClick={() =>
              navigate(withLocale(locale, `competitions/${competition.id}/question`), {
                state: flowState,
              })
            }
          >
            Back to challenge
          </button>
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
