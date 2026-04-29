'use client';

import { Menu, Barcode, Whatsapp } from './icons';
import { Button, buttonVariants } from './ui/button';
import { Sheet, SheetContent, SheetTrigger } from './ui/sheet';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { MoveUpRightIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import type { Session } from 'next-auth';
import { VideoBackground } from './video-bg';

export function MobileNav({ session }: { session: Session | null }) {
  const [open, setOpen] = useState(false);
  const t = useTranslations('navitems');
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant='ghost'
          className='m-0 px-0 text-base hover:bg-transparent focus-visible:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 md:hidden'
        >
          <Menu className='h-6 w-6' />
          <span className='sr-only'>Toggle Menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side='right' className='w-full border-none p-0 '>
        <VideoBackground />
        <div className='flex h-full w-full flex-col justify-start  pt-5 '>
          <div className='z-20 flex h-4/5 flex-col justify-between px-5'>
            <Barcode className='h-6 w-14 ' />
            <div className='flex flex-col gap-6 text-xl'>
              <Link
                href='/winners'
                className='font-helve text-background'
                onClick={() => setOpen(false)}
              >
                {t('winners')}
              </Link>
              <Link
                href='/howtoplay'
                className='font-helve  text-background'
                onClick={() => setOpen(false)}
              >
                {t('howto')}
              </Link>
              {/* <Link
                href='/engagement'
                className=' font-helve text-background '
                onClick={() => setOpen(false)}
              >
                {t('engage')}
              </Link> */}
              <Link
                href='/feed'
                className='font-helve text-background '
                onClick={() => setOpen(false)}
              >
                {t('feed')}
              </Link>
              <Link
                href='/faq'
                className='font-helve text-background  '
                onClick={() => setOpen(false)}
              >
                {t('faq')}
              </Link>
              <Link
                href='/about-us'
                className='font-helve text-background '
                onClick={() => setOpen(false)}
              >
                {t('about')}
              </Link>
              <Link
                href='/contact-us'
                className='font-helve text-background '
                onClick={() => setOpen(false)}
              >
                {t('contact_us')}
              </Link>
            </div>
            <Link
              target='_blank'
              rel='noreferrer'
              href={session ? '/api/auth/signout' : '/api/auth/signin'}
              className={cn(
                buttonVariants({ variant: 'ghost' }),
                'inline-flex items-center justify-between gap-2 border-b p-0  hover:bg-transparent',
              )}
              onClick={() => setOpen(false)}
            >
              <p className='text-center text-xs text-white '>
                {session ? 'Sign Out' : 'Connect to your account'}
              </p>
              <MoveUpRightIcon
                className='mt-1 h-5 w-5 font-bold '
                color='white'
              />
            </Link>
            <div className='flex flex-col gap-4 text-white'>
              <div className='flex items-end   gap-1'>
                <p className='text-lg'>WINUWATCH</p>
                <p className='text-sm font-semibold'>Family</p>
              </div>
              <Link
                target='_blank'
                rel='noreferrer'
                href='https://wa.me/447488863429'
                className={cn(
                  buttonVariants({ variant: 'ghost' }),
                  'inline-flex items-center justify-between gap-2 border-b p-0 hover:bg-transparent',
                )}
                onClick={() => setOpen(false)}
              >
                <p className='text-center text-xs text-white '>
                  We are available on
                </p>
                <Whatsapp className='h-9 w-20  fill-secondary' />
                <MoveUpRightIcon
                  className='mt-1 h-5 w-5 font-bold '
                  color='white'
                />
              </Link>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
