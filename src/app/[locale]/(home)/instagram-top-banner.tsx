'use client';

import { Instapography, Instaicon } from '@/components/icons';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

export function InstagramTopBanner({
  instagramCount,
}: Readonly<{
  instagramCount: string;
}>) {
  const Thome = useTranslations('home');
  return (
    <Link
      target='_blank'
      rel='noreferrer'
      href='https://www.instagram.com/winuwatch/'
      aria-label='Follow WINUWATCH on Instagram'
    >
      <div className='flex items-center justify-center gap-4 bg-zinc-100  px-2  py-3 md:hidden'>
        <p className='text-center font-helve text-xs  font-bold text-foreground xs:text-sm'>
          {Thome('join_our_community', {
            value: instagramCount || '...',
          })}
        </p>
        <Instapography className='mt-1 h-4  xs:h-5' />
        <Instaicon className='h-4 w-4 xs:h-5 xs:w-5' />
      </div>
    </Link>
  );
}
