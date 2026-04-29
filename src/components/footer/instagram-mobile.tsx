'use client';

import { cn } from '@/lib/utils';
import { buttonVariants } from '../ui/button';
import Link from 'next/link';
import { Separator } from '../ui/separator';
import { Instapography, Instagradient } from '../icons';
import { useTranslations } from 'next-intl';

export function InstagramMobile({
  instagramCount,
  isMobile = true,
}: Readonly<{
  instagramCount: string;
  isMobile?: boolean;
}>) {
  const Thome = useTranslations('home');
  return (
    <div
      className={cn({
        'flex flex-col items-center gap-2 bg-foreground py-12 md:hidden':
          isMobile,
        'hidden flex-col justify-between gap-2  border-b-2 border-b-foreground bg-background pb-3 md:flex lg:flex-row xl:pb-16':
          !isMobile,
      })}
    >
      <div className='flex flex-col md:items-start gap-2 md:gap-0'>
        <Instapography className='h-[68px ]md:h-8 fill-white md:fill-foreground ' />
        <p className='text-center font-helve text-sm font-bold text-emerald-700 text-[15px] md:text-start md:text-[12px] md:text-zinc-700 -tracking-normal'>
          {Thome('join_our_community', {
            value: instagramCount || '...',
          })}
        </p>
      </div>

      <Link
        target='_blank'
        rel='noreferrer'
        href='https://www.instagram.com/winuwatch/'
        aria-label='Follow WINUWATCH on Instagram'
        className={cn(
          buttonVariants({ variant: 'ghost' }),
          'flex h-auto flex-col   gap-3 bg-transparent p-0 text-white   hover:bg-transparent  hover:text-white md:h-12 md:flex-row md:rounded-lg md:bg-foreground md:px-4 md:hover:bg-foreground text-[14px] mt-[29px] md:mt-0',
        )}
      >
        <div>
          {Thome('follow_us_on')}
          <Separator className='mt-1 md:hidden' />
        </div>
        <Instagradient
          className='h-[33.23px] w-[33.23px] md:h-6 md:w-6 '
          prefix={'icon-' + isMobile}
        />
      </Link>
    </div>
  );
}
