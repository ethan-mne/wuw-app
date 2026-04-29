'use client';
import { useLocale, useTranslations } from 'next-intl';
import { locales } from '../config';
import Link from 'next/link';
function ExternalLink({
  description,
  href,
  title,
}: {
  title: string;
  description: string;
  href: string;
}) {
  return (
    <Link
      className='inline-block rounded-md border border-gray-700 p-8 transition-colors hover:border-gray-400'
      href={href}
      rel='noreferrer'
      target='_blank'
    >
      <p className='text-xl font-semibold text-white'>
        {title} <span className='ml-2 inline-block'>→</span>
      </p>
      <p className='mt-2 max-w-[250px] text-gray-400'>{description}</p>
    </Link>
  );
}
export function LocaleSwitcher() {
  const t = useTranslations('LocaleSwitcher');
  const locale = useLocale();

  return (
    <div>
      {locales.map((cur) => (
        <div key={cur}>{t('locale', { locale: cur })}</div>
      ))}
    </div>
  );
}

// export default function Navigation() {
//   const t = useTranslations('Navigation');

//   return (
//     <div className='bg-slate-850'>
//       <nav className='container flex justify-between p-2 text-white'>
//         <div>
//           <Link href='/'>{t('home')}</Link>
//           <Link href='/pathnames'>{t('pathnames')}</Link>
//         </div>
//         <LocaleSwitcher />
//       </nav>
//     </div>
//   );
// }
