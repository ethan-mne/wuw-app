export type ProfileCountry = {
  iso: string;
  name: string;
  dial: string;
  flag: string;
};

/** Common countries for profile & phone prefix picker (dial without +). */
export const PROFILE_COUNTRIES: ProfileCountry[] = [
  { iso: 'FR', name: 'France', dial: '33', flag: '🇫🇷' },
  { iso: 'GB', name: 'United Kingdom', dial: '44', flag: '🇬🇧' },
  { iso: 'DE', name: 'Germany', dial: '49', flag: '🇩🇪' },
  { iso: 'ES', name: 'Spain', dial: '34', flag: '🇪🇸' },
  { iso: 'IT', name: 'Italy', dial: '39', flag: '🇮🇹' },
  { iso: 'PT', name: 'Portugal', dial: '351', flag: '🇵🇹' },
  { iso: 'NL', name: 'Netherlands', dial: '31', flag: '🇳🇱' },
  { iso: 'BE', name: 'Belgium', dial: '32', flag: '🇧🇪' },
  { iso: 'CH', name: 'Switzerland', dial: '41', flag: '🇨🇭' },
  { iso: 'AT', name: 'Austria', dial: '43', flag: '🇦🇹' },
  { iso: 'IE', name: 'Ireland', dial: '353', flag: '🇮🇪' },
  { iso: 'LU', name: 'Luxembourg', dial: '352', flag: '🇱🇺' },
  { iso: 'MC', name: 'Monaco', dial: '377', flag: '🇲🇨' },
  { iso: 'SE', name: 'Sweden', dial: '46', flag: '🇸🇪' },
  { iso: 'US', name: 'United States', dial: '1', flag: '🇺🇸' },
  { iso: 'CA', name: 'Canada', dial: '1', flag: '🇨🇦' },
  { iso: 'AU', name: 'Australia', dial: '61', flag: '🇦🇺' },
  { iso: 'NZ', name: 'New Zealand', dial: '64', flag: '🇳🇿' },
  { iso: 'AE', name: 'United Arab Emirates', dial: '971', flag: '🇦🇪' },
  { iso: 'IL', name: 'Israel', dial: '972', flag: '🇮🇱' },
  { iso: 'ZA', name: 'South Africa', dial: '27', flag: '🇿🇦' },
  { iso: 'BR', name: 'Brazil', dial: '55', flag: '🇧🇷' },
  { iso: 'MX', name: 'Mexico', dial: '52', flag: '🇲🇽' },
  { iso: 'IN', name: 'India', dial: '91', flag: '🇮🇳' },
  { iso: 'JP', name: 'Japan', dial: '81', flag: '🇯🇵' },
  { iso: 'CN', name: 'China', dial: '86', flag: '🇨🇳' },
  { iso: 'HK', name: 'Hong Kong', dial: '852', flag: '🇭🇰' },
  { iso: 'SG', name: 'Singapore', dial: '65', flag: '🇸🇬' },
  { iso: 'PL', name: 'Poland', dial: '48', flag: '🇵🇱' },
];

const byDialLength = [...PROFILE_COUNTRIES].sort((a, b) => b.dial.length - a.dial.length);

/**
 * Map API value (full name, ISO code, or variant) to the canonical `name` used as <option value>.
 */
export function normalizeCountryForSelect(stored: string | null | undefined): string {
  const t = stored?.trim() ?? '';
  if (!t) {
    return '';
  }
  if (PROFILE_COUNTRIES.some((c) => c.name === t)) {
    return t;
  }
  const byNameCi = PROFILE_COUNTRIES.find((c) => c.name.toLowerCase() === t.toLowerCase());
  if (byNameCi) {
    return byNameCi.name;
  }
  const iso = t.toUpperCase();
  const byIso = PROFILE_COUNTRIES.find((c) => c.iso === iso);
  if (byIso) {
    return byIso.name;
  }
  return t;
}

/** Read-only label: prefer full country name when DB has ISO. */
export function formatCountryDisplay(stored: string | null | undefined): string {
  const t = stored?.trim() ?? '';
  if (!t) {
    return '—';
  }
  const canonical = normalizeCountryForSelect(t);
  return canonical;
}

/**
 * Split stored phone into dial (no +) and national digits for the form.
 */
export function parsePhoneForForm(phone: string | null | undefined): {
  dial: string;
  national: string;
} {
  const raw = phone?.trim() ?? '';
  if (!raw) {
    return { dial: '33', national: '' };
  }
  let digits = raw.replace(/[\s().-]/g, '');
  if (digits.startsWith('+')) {
    digits = digits.slice(1);
  } else if (digits.startsWith('00')) {
    digits = digits.slice(2);
  }
  for (const c of byDialLength) {
    if (digits.startsWith(c.dial)) {
      return { dial: c.dial, national: digits.slice(c.dial.length) };
    }
  }
  if (/^0\d{8,}/.test(digits)) {
    return { dial: '33', national: digits };
  }
  return { dial: '33', national: digits };
}

/** E.164-style value for API */
export function formatPhoneForApi(dial: string, national: string): string {
  let n = national.replace(/[\s().-]/g, '');
  const d = dial.replace(/\D/g, '');
  if (!n) {
    return '';
  }
  if ((d === '33' || d === '44') && n.startsWith('0')) {
    n = n.slice(1);
  }
  return `+${d}${n}`;
}

/** Pick ISO for phone prefix select (shared dials → match country name when possible). */
export function isoForPhonePrefix(dial: string, countryName: string | null | undefined): string {
  const matches = PROFILE_COUNTRIES.filter((c) => c.dial === dial);
  if (matches.length === 0) {
    return 'FR';
  }
  if (matches.length === 1) {
    return matches[0].iso;
  }
  const named = countryName
    ? matches.find((m) => m.name.toLowerCase() === countryName.trim().toLowerCase())
    : undefined;
  return named?.iso ?? matches[0].iso;
}
