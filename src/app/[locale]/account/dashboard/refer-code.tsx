'use client';
import { Barcode, Whatsapp } from '@/components/icons';
import { Button, buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';
import { useCallback } from 'react';
import { ClipboardButton } from './clipboard-button';

export function ReferCode({
  referCode,
  compLink,
}: {
  referCode: string;
  compLink: string;
}) {
  const Taccount = useTranslations('account');
  const sendWhatsapp = useCallback(() => {
    const encodedMessage = encodeURIComponent(
      Taccount('coupon', { CODE: referCode }),
    );

    // Detect the platform
    const userAgent = window.navigator.userAgent || '';

    if (/android/i.test(userAgent)) {
      // For Android devices
      window.location.href = `intent://send/#Intent;scheme=whatsapp;package=com.whatsapp;i.text=${encodedMessage};end`;
    } else if (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) {
      // For iOS devices
      window.location.href = `whatsapp://send?text=${encodedMessage}`;
    } else {
      // For desktop browsers
      window.open(
        `https://web.whatsapp.com/send?text=${encodedMessage}`,
        '_blank',
        'noopener,noreferrer',
      );
    }
  }, []);
  return (
    <div className='w-full h-[440px] bg-foreground flex justify-center items-center py-3  px-4 md:px-0'>
      <div className='md:w-4/5 h-full flex flex-col gap-[40px] items-start md:items-center justify-center'>
        <div className='flex flex-row justify-center items-center gap-[18px]'>
          <Barcode className='h-[48px] w-[116.13px] ' />
          {/* <QRCode value={`https://winuwatch.com`} size={150} /> */}
          <h2 className='text-background'>
            {Taccount('share_code_with_friends')}
          </h2>
        </div>

        <p className='text-[15px] text-background text-start md:text-center leading-[24px] -tracking-normal'>
          <span className='text-secondary'>
            {' '}
            {Taccount('you_earn_a_free_ticket')}
          </span>
        </p>
        <ClipboardButton
          code={referCode}
          className='rounded-full md:rounded-none'
        />
        <Button
          onClick={sendWhatsapp}
          className={cn(
            buttonVariants({ variant: 'outline' }),
            'flex justify-center items-center gap-3 h-16 rounded-full bg-transparent group w-full xs:w-[271px]',
          )}
        >
          <span className='text-[16px] xs:text-[20px] font-bold  text-background group-hover:text-foreground'>
            {Taccount('share_it_on')}
          </span>
          <Whatsapp className='h-9 fill-secondary' />
        </Button>
      </div>
    </div>
  );
}
