import { type FormEvent, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';

import { Card, PageHeader } from '../../components/ui';
import {
  PROFILE_COUNTRIES,
  formatPhoneForApi,
  formatCountryDisplay,
  isoForPhonePrefix,
  normalizeCountryForSelect,
  parsePhoneForForm,
} from '../../data/profileCountries';
import {
  AccountDataError,
  AccountSignInRequired,
} from '../../features/account/AccountFetchFallback';
import { AccountNav } from '../../features/account/AccountNav';
import { useCachedQuery } from '../../hooks/useCachedQuery';
import { cacheKeys } from '../../lib/dataCache';
import { defaultLocale, isLocale, withLocale } from '../../routes/locales';
import { mobileDataService } from '../../services/mobileDataService';
import type { MobileUserProfile } from '../../types';

type LoadPhase = 'loading' | 'ok' | 'sign_in_required' | 'error';
const GOOGLE_CALENDAR_ADD_BY_URL = 'https://calendar.google.com/calendar/u/0/r/settings/addbyurl';
const ADMIN_DASHBOARD_ENTRY = 'dashboard/competitions/schedule';

type ProfileFormState = {
  firstName: string;
  lastName: string;
  country: string;
  postalCode: string;
  address: string;
  city: string;
  phoneIso: string;
  phoneNational: string;
  email: string;
};

function nationalDigitsPretty(national: string): string {
  const d = national.replace(/\D/g, '');
  if (d.length <= 2) {
    return d;
  }
  return d.replace(/(\d{2})(?=\d)/g, '$1 ').trim();
}

function profileToForm(p: MobileUserProfile): ProfileFormState {
  const { dial, national } = parsePhoneForForm(p.phone);
  const countryNorm = normalizeCountryForSelect(p.country);
  const phoneIso = isoForPhonePrefix(dial, countryNorm);
  return {
    firstName: p.firstName?.trim() ?? '',
    lastName: p.lastName?.trim() ?? '',
    country: countryNorm,
    postalCode: p.zipCode?.trim() ?? '',
    address: p.address?.trim() ?? '',
    city: p.city?.trim() ?? '',
    phoneIso,
    phoneNational: nationalDigitsPretty(national),
    email: p.email.trim(),
  };
}

function showField(value: string | null | undefined): string {
  const t = value?.trim();
  return t ? t : '—';
}

function PhoneReadonly({ phone }: { phone: string | null | undefined }) {
  const t = phone?.trim();
  if (!t) {
    return <>—</>;
  }
  const { dial, national } = parsePhoneForForm(t);
  const meta = PROFILE_COUNTRIES.find((c) => c.dial === dial);
  const pretty = nationalDigitsPretty(national);
  return (
    <span className="account-profile-phone-readonly">
      {meta ? <span aria-hidden>{meta.flag} </span> : null}
      <span className="account-profile-phone-readonly-dial">+{dial}</span>{' '}
      <span>{pretty}</span>
    </span>
  );
}

export function AccountProfilePage() {
  const params = useParams();
  const locale = isLocale(params.locale) ? params.locale : defaultLocale;
  const {
    data: result,
    isLoading,
    refetch,
    mutate,
  } = useCachedQuery(cacheKeys.mobileProfile, () => mobileDataService.loadMobileProfile());
  const profile = result?.kind === 'ok' ? result.data : undefined;
  const phase: LoadPhase = !result
    ? isLoading
      ? 'loading'
      : 'error'
    : result.kind === 'ok'
      ? 'ok'
      : result.kind;
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<ProfileFormState | null>(null);
  const [formErrors, setFormErrors] = useState<string[]>([]);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [calendarBusy, setCalendarBusy] = useState<'copy' | 'regenerate' | 'revoke' | null>(null);
  const [calendarNotice, setCalendarNotice] = useState<string | null>(null);
  const [calendarError, setCalendarError] = useState<string | null>(null);
  const [calendarRevoked, setCalendarRevoked] = useState(false);

  const {
    data: calendarSubscription,
    isLoading: calendarLoading,
    mutate: mutateCalendarSubscription,
  } = useCachedQuery(
    cacheKeys.calendarFeedSubscription,
    () => mobileDataService.getCalendarFeedSubscription(),
    { enabled: phase === 'ok' },
  );

  const countryOptions = useMemo(
    () => [...PROFILE_COUNTRIES].sort((a, b) => a.name.localeCompare(b.name)),
    [],
  );

  const startEditing = () => {
    if (!profile) return;
    setForm(profileToForm(profile));
    setFormErrors([]);
    setSaveError(null);
    setEditing(true);
  };

  const cancelEditing = () => {
    setEditing(false);
    setForm(null);
    setFormErrors([]);
    setSaveError(null);
  };

  const onFieldChange = (key: keyof ProfileFormState, value: string) => {
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  const onCountrySelect = (name: string) => {
    setForm((prev) => {
      if (!prev) return prev;
      const c = PROFILE_COUNTRIES.find((x) => x.name === name);
      return {
        ...prev,
        country: name,
        ...(c ? { phoneIso: c.iso } : {}),
      };
    });
  };

  const validateForm = (f: ProfileFormState): string[] => {
    const next: string[] = [];
    if (!f.firstName.trim()) next.push('First name is required.');
    if (!f.lastName.trim()) next.push('Last name is required.');
    if (!f.country.trim()) next.push('Country / region is required.');
    if (!f.email.trim() || !f.email.includes('@')) next.push('A valid email is required.');
    if (!f.phoneNational.trim()) next.push('Phone is required.');
    if (!f.address.trim()) next.push('Address is required.');
    if (!f.city.trim()) next.push('Town / city is required.');
    if (!f.postalCode.trim()) next.push('Zip code is required.');
    return next;
  };

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form) return;
    const nextErrors = validateForm(form);
    setFormErrors(nextErrors);
    setSaveError(null);
    if (nextErrors.length > 0) return;

    const dial = PROFILE_COUNTRIES.find((c) => c.iso === form.phoneIso)?.dial ?? '33';
    const phoneApi = formatPhoneForApi(dial, form.phoneNational);
    if (!phoneApi) {
      setFormErrors(['Phone is required.']);
      return;
    }

    setSaving(true);
    void mobileDataService
      .updateMobileProfile({
        firstname: form.firstName.trim(),
        lastname: form.lastName.trim(),
        email: form.email.trim(),
        phone: phoneApi,
        address: form.address.trim(),
        city: form.city.trim(),
        country: form.country.trim(),
        zip: form.postalCode.trim(),
      })
      .then((result) => {
        setSaving(false);
        if (result.kind === 'ok') {
          mutate({ kind: 'ok', data: result.data });
          setEditing(false);
          setForm(null);
          return;
        }
        if (result.kind === 'sign_in_required') {
          setSaveError('Sign in to save your profile.');
          return;
        }
        if (result.kind === 'invalid') {
          setSaveError(result.message);
          return;
        }
        setSaveError('Something went wrong. Try again.');
      });
  };

  const copyCalendarLink = async () => {
    if (!calendarSubscription) {
      return;
    }
    const toCopy = calendarSubscription.webcalUrl || calendarSubscription.httpsUrl;
    if (!toCopy) {
      setCalendarError('No calendar link available yet.');
      return;
    }

    setCalendarBusy('copy');
    setCalendarError(null);
    setCalendarNotice(null);

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(toCopy);
      } else {
        const fallback = document.createElement('textarea');
        fallback.value = toCopy;
        fallback.setAttribute('readonly', 'true');
        fallback.style.position = 'absolute';
        fallback.style.left = '-9999px';
        document.body.appendChild(fallback);
        fallback.select();
        document.execCommand('copy');
        document.body.removeChild(fallback);
      }
      setCalendarNotice('Calendar subscription link copied.');
    } catch {
      setCalendarError('Could not copy the calendar link. Try again.');
    } finally {
      setCalendarBusy(null);
    }
  };

  const regenerateCalendarLink = async () => {
    setCalendarBusy('regenerate');
    setCalendarError(null);
    setCalendarNotice(null);
    try {
      const next = await mobileDataService.regenerateCalendarFeedToken();
      mutateCalendarSubscription(next);
      setCalendarRevoked(false);
      setCalendarNotice('Calendar link regenerated. Old link is now invalid.');
    } catch {
      setCalendarError('Could not regenerate the calendar link. Try again.');
    } finally {
      setCalendarBusy(null);
    }
  };

  const revokeCalendarLink = async () => {
    setCalendarBusy('revoke');
    setCalendarError(null);
    setCalendarNotice(null);
    try {
      await mobileDataService.revokeCalendarFeedToken();
      setCalendarRevoked(true);
      setCalendarNotice('Calendar link revoked. Regenerate to create a new one.');
    } catch {
      setCalendarError('Could not revoke the calendar link. Try again.');
    } finally {
      setCalendarBusy(null);
    }
  };

  if (phase === 'loading') {
    return (
      <div
        className="home-competitions-loading page-content-pad"
        role="status"
        aria-live="polite"
      >
        <span className="home-competitions-loading-spinner" aria-hidden />
        <span className="sr-only">Loading profile...</span>
      </div>
    );
  }

  if (phase === 'sign_in_required') {
    return <AccountSignInRequired pageTitle="Profile" />;
  }

  if (phase === 'error') {
    return (
      <AccountDataError pageTitle="Profile" onRetry={() => refetch()} />
    );
  }

  if (!profile) {
    return (
      <AccountDataError pageTitle="Profile" onRetry={() => refetch()} />
    );
  }

  const emailVerified = Boolean(profile.emailVerified);

  return (
    <section className="page-stack page-content-pad">
      <PageHeader eyebrow="Account" title="Profile" />
      <AccountNav />

      <Card>
        {!editing ? (
          <>
            <div className="account-profile-header-copy">
              <p className="status-label">Signed in as</p>
              <h3 className="account-profile-display-name">
                {[profile.firstName, profile.lastName].filter(Boolean).join(' ').trim() ||
                  showField(profile.email)}
              </h3>
              <p className={`account-profile-email-badge${emailVerified ? ' is-verified' : ''}`}>
                {emailVerified ? 'Email verified' : 'Email not verified'}
              </p>
            </div>

            <div className="account-profile-readonly">
              <h4 className="account-profile-section-title">Your details</h4>
              <dl>
                <div>
                  <dt>First name</dt>
                  <dd>{showField(profile.firstName)}</dd>
                </div>
                <div>
                  <dt>Last name</dt>
                  <dd>{showField(profile.lastName)}</dd>
                </div>
                <div>
                  <dt>Country / region</dt>
                  <dd>{formatCountryDisplay(profile.country)}</dd>
                </div>
                <div>
                  <dt>Zip code</dt>
                  <dd>{showField(profile.zipCode)}</dd>
                </div>
                <div>
                  <dt>Address</dt>
                  <dd>{showField(profile.address)}</dd>
                </div>
                <div>
                  <dt>Town / city</dt>
                  <dd>{showField(profile.city)}</dd>
                </div>
                <div>
                  <dt>Phone</dt>
                  <dd>
                    <PhoneReadonly phone={profile.phone} />
                  </dd>
                </div>
                <div>
                  <dt>Email</dt>
                  <dd>{showField(profile.email)}</dd>
                </div>
              </dl>
            </div>

            <div className="account-profile-calendar">
              <h4 className="account-profile-section-title">Subscribed calendar</h4>
              <p className="account-profile-calendar-copy">
                Subscribe from Apple or Google Calendar and your draw dates will update automatically.
              </p>
              {calendarLoading ? (
                <p className="account-profile-calendar-meta" role="status">
                  Preparing your calendar link…
                </p>
              ) : calendarSubscription ? (
                <div className="account-profile-calendar-details">
                  <p className="account-profile-calendar-meta">
                    Token: <code>{calendarSubscription.tokenPreview}</code>
                  </p>
                  {calendarRevoked ? (
                    <p className="account-profile-calendar-meta">Current link disabled.</p>
                  ) : null}
                  <div className="account-profile-calendar-help">
                    <p className="account-profile-calendar-help-title">How to subscribe</p>
                    <ul className="account-profile-calendar-help-list">
                      <li>iPhone / Apple Calendar: tap “Subscribe now”.</li>
                      <li>
                        Google Calendar: copy the HTTPS link, then open{' '}
                        <a href={GOOGLE_CALENDAR_ADD_BY_URL} target="_blank" rel="noreferrer">
                          Add by URL
                        </a>
                        .
                      </li>
                    </ul>
                  </div>
                </div>
              ) : (
                <p className="account-profile-calendar-meta">Calendar link unavailable.</p>
              )}

              {calendarError ? <p className="account-profile-calendar-error">{calendarError}</p> : null}
              {calendarNotice ? (
                <p className="account-profile-calendar-notice" role="status">
                  {calendarNotice}
                </p>
              ) : null}

              <div className="account-profile-calendar-actions">
                <button
                  type="button"
                  className="checkout-flow-button"
                  disabled={!calendarSubscription || calendarRevoked || calendarBusy !== null}
                  onClick={() => {
                    if (!calendarSubscription || calendarRevoked) {
                      return;
                    }
                    window.location.href = calendarSubscription.webcalUrl;
                  }}
                >
                  Subscribe now
                </button>
                <button
                  type="button"
                  className="checkout-flow-button checkout-flow-button--ghost"
                  disabled={!calendarSubscription || calendarRevoked || calendarBusy !== null}
                  onClick={() => void copyCalendarLink()}
                >
                  {calendarBusy === 'copy' ? 'Copying…' : 'Copy link (webcal)'}
                </button>
                <button
                  type="button"
                  className="checkout-flow-button checkout-flow-button--ghost"
                  disabled={!calendarSubscription || calendarRevoked || calendarBusy !== null}
                  onClick={async () => {
                    if (!calendarSubscription) {
                      return;
                    }
                    setCalendarBusy('copy');
                    setCalendarError(null);
                    setCalendarNotice(null);
                    try {
                      const url = calendarSubscription.httpsUrl;
                      if (navigator.clipboard?.writeText) {
                        await navigator.clipboard.writeText(url);
                      } else {
                        const fallback = document.createElement('textarea');
                        fallback.value = url;
                        fallback.setAttribute('readonly', 'true');
                        fallback.style.position = 'absolute';
                        fallback.style.left = '-9999px';
                        document.body.appendChild(fallback);
                        fallback.select();
                        document.execCommand('copy');
                        document.body.removeChild(fallback);
                      }
                      setCalendarNotice('HTTPS calendar link copied for Google Calendar.');
                    } catch {
                      setCalendarError('Could not copy the HTTPS link. Try again.');
                    } finally {
                      setCalendarBusy(null);
                    }
                  }}
                >
                  {calendarBusy === 'copy' ? 'Copying…' : 'Copy link (https)'}
                </button>
                <button
                  type="button"
                  className="checkout-flow-button checkout-flow-button--ghost"
                  disabled={calendarBusy !== null}
                  onClick={() => void regenerateCalendarLink()}
                >
                  {calendarBusy === 'regenerate' ? 'Regenerating…' : 'Regenerate link'}
                </button>
                <button
                  type="button"
                  className="checkout-flow-button checkout-flow-button--ghost"
                  disabled={calendarBusy !== null || calendarRevoked}
                  onClick={() => void revokeCalendarLink()}
                >
                  {calendarBusy === 'revoke' ? 'Disabling…' : 'Disable link'}
                </button>
              </div>
            </div>

            <button type="button" className="checkout-flow-button" onClick={startEditing}>
              Edit details
            </button>
            {profile.isAdmin ? (
              <button
                type="button"
                className="checkout-flow-button checkout-flow-button--ghost"
                onClick={() => window.location.assign(withLocale(locale, ADMIN_DASHBOARD_ENTRY))}
              >
                Open admin dashboard
              </button>
            ) : null}
          </>
        ) : (
          <form className="checkout-form account-profile-form" onSubmit={onSubmit}>
            <h4 className="account-profile-section-title">Edit your details</h4>
            {saveError || formErrors.length > 0 ? (
              <div className="checkout-flow-errors" aria-live="polite">
                {saveError ? <p key="save">{saveError}</p> : null}
                {formErrors.map((err) => (
                  <p key={err}>{err}</p>
                ))}
              </div>
            ) : null}
            <div className="checkout-form-grid account-profile-form-grid">
              <label>
                <span>First name</span>
                <input
                  value={form?.firstName ?? ''}
                  onChange={(e) => onFieldChange('firstName', e.target.value)}
                  autoComplete="given-name"
                />
              </label>
              <label>
                <span>Last name</span>
                <input
                  value={form?.lastName ?? ''}
                  onChange={(e) => onFieldChange('lastName', e.target.value)}
                  autoComplete="family-name"
                />
              </label>
              <label className="account-profile-field-full">
                <span>Country / region</span>
                <select
                  value={form?.country ?? ''}
                  onChange={(e) => onCountrySelect(e.target.value)}
                  autoComplete="country"
                >
                  <option value="">Select country / region</option>
                  {form?.country &&
                  form.country.trim() !== '' &&
                  !countryOptions.some((c) => c.name === form.country) ? (
                    <option value={form.country}>{form.country}</option>
                  ) : null}
                  {countryOptions.map((c) => (
                    <option key={c.iso} value={c.name}>
                      {c.flag} {c.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>Zip code</span>
                <input
                  value={form?.postalCode ?? ''}
                  onChange={(e) => onFieldChange('postalCode', e.target.value)}
                  autoComplete="postal-code"
                />
              </label>
              <label className="account-profile-field-full">
                <span>Address</span>
                <input
                  value={form?.address ?? ''}
                  onChange={(e) => onFieldChange('address', e.target.value)}
                  autoComplete="street-address"
                />
              </label>
              <label>
                <span>Town / city</span>
                <input
                  value={form?.city ?? ''}
                  onChange={(e) => onFieldChange('city', e.target.value)}
                  autoComplete="address-level2"
                />
              </label>
              <label className="account-profile-field-full">
                <span>Phone</span>
                <div className="account-profile-phone-row">
                  <div className="account-profile-phone-prefix">
                    <select
                      value={form?.phoneIso ?? 'FR'}
                      onChange={(e) => onFieldChange('phoneIso', e.target.value)}
                      aria-label="Country calling code"
                    >
                      {PROFILE_COUNTRIES.map((c) => (
                        <option key={c.iso} value={c.iso}>
                          {c.flag} +{c.dial}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="account-profile-phone-number">
                    <input
                      value={form?.phoneNational ?? ''}
                      onChange={(e) => onFieldChange('phoneNational', e.target.value)}
                      placeholder="Phone number"
                      autoComplete="tel-national"
                      inputMode="tel"
                    />
                  </div>
                </div>
              </label>
              <label className="account-profile-field-full">
                <span>Email</span>
                <input
                  type="email"
                  value={form?.email ?? ''}
                  onChange={(e) => onFieldChange('email', e.target.value)}
                  autoComplete="email"
                />
              </label>
            </div>
            <div className="account-profile-form-actions">
              <button type="submit" className="checkout-flow-button" disabled={saving}>
                {saving ? 'Saving…' : 'Save changes'}
              </button>
              <button
                type="button"
                className="checkout-flow-button checkout-flow-button--ghost"
                disabled={saving}
                onClick={cancelEditing}
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </Card>
    </section>
  );
}
