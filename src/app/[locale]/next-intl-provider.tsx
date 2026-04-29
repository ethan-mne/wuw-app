import { NextIntlClientProvider, useMessages } from 'next-intl';
import { type ReactNode } from 'react';

export const NextIntlProvider = ({ children }: { children: ReactNode }) => {
  const messages = useMessages();
  return (
    <NextIntlClientProvider messages={messages} timeZone='Europe/London'>
      {children}
    </NextIntlClientProvider>
  );
};
