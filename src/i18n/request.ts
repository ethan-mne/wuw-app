/* eslint-disable */
import { getRequestConfig } from 'next-intl/server';
import { locales, type Locale } from '../config';

export default getRequestConfig(async ({ requestLocale }) => {
  const requestedLocale = await requestLocale;
  const locale = locales.includes(requestedLocale as Locale)
    ? (requestedLocale as Locale)
    : locales[0];

  return {
    locale,
    messages: (
      await (locale === 'en'
        ? // When using Turbopack, this will enable HMR for `en`
          import('../../messages/en.json')
        : import(`../../messages/${locale}.json`))
    ).default,
  };
});
