'use client';

import { cn } from '@/lib/utils';
import { usePathname } from '@/navigation';
import { useTranslations } from 'next-intl';
import Link from 'next/link';

export function AccountNav() {
  const pathname = usePathname();
  const Taccount = useTranslations('account');

  return (
    <nav className='flex justify-center gap-6 text-[13px] xs:text-[14px] md:text-[16px] -tracking-[0.03em] '>
      <Link
        href='/account/dashboard'
        className={cn(
          'transition-colors ',
          pathname?.startsWith('/account/dashboard')
            ? 'text-white  font-bold underline underline-offset-4 md:underline-offset-8 decoration-2'
            : 'text-[#E4E4E4] font-medium',
        )}
      >
        {Taccount('dashboard')}
      </Link>
      <Link
        href='/account/profile'
        className={cn(
          'transition-colors ',
          pathname?.startsWith('/account/profile')
            ? 'text-white font-bold underline underline-offset-4 md:underline-offset-8 decoration-2'
            : 'text-[#E4E4E4] font-medium',
        )}
      >
        {Taccount('profile')}
      </Link>
      <Link
        href='/account/history'
        className={cn(
          'transition-colors ',
          pathname?.startsWith('/account/history')
            ? 'text-white font-bold underline underline-offset-4 md:underline-offset-8 decoration-2'
            : 'text-[#E4E4E4] font-medium',
        )}
      >
        {Taccount('history')}
      </Link>
      <Link
        href='/account/referrals'
        className={cn(
          'transition-colors ',
          pathname?.startsWith('/account/referrals')
            ? 'text-white font-bold underline underline-offset-4 md:underline-offset-8 decoration-2'
            : 'text-[#E4E4E4] font-medium',
        )}
      >
        {Taccount('referrals')}
      </Link>
    </nav>
  );
}
