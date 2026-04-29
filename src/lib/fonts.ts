import localFont from 'next/font/local';
import { Roboto } from 'next/font/google';

export const helvetica = localFont({
  src: '../../public/fonts/HelveticaNeueBold.ttf',
  display: 'swap',
  weight: '700',
  variable: '--font-helvetica',
});

export const helveticaMedium = localFont({
  src: '../../public/fonts/HelveticaNeueMedium.ttf',
  style: 'normal',
  weight: '500',
});

export const roboto = Roboto({
  subsets: ['latin'],
  display: 'swap',
  weight: '700',
  variable: '--font-robot',
});
