export const locales = ['en', 'es', 'fr'] as const;
export type Locale = (typeof locales)[number];
