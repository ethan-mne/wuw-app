'use client';

import { Button } from '@/components/ui/button';
import type { CompetitionInterface } from '@/lib/interfaces';
import type { Order } from '@prisma/client';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export function PendingStep({
  competition,
  order,
}: Readonly<{
  competition: CompetitionInterface;
  order: Order;
}>) {
  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  }, []);

  const router = useRouter();
  const Tcompetition = useTranslations('competition');
  const Thome = useTranslations('home');

  return (
    <div className='w-full flex justify-center items-center p-4 md:p-0'>
      <div className='w-full lg:w-4/5 flex flex-col self-center gap-8'>
        <p className='text-[24px] text-foreground font-bold uppercase -tracking-[0.05em]'>
          {Tcompetition('thank_you')} {order.first_name}
        </p>
        <div className='flex flex-col text-[40px] md:text-[64px] font-bold leading-tight -tracking-[0.05em]'>
          <p className='uppercase text-secondary'>
            {Thome('competition')} {competition.name}
          </p>
          <p className='uppercase text-foreground'>
            {Tcompetition('pending_confirmation')}
          </p>
        </div>
        <p className='text-[#898989] text-[22px] md:text-[26px] font-bold -tracking-[0.03em] leading-[37px]'>
          {Tcompetition('pending_message')}
        </p>
        <p className='text-[#898989] text-[18px] md:text-[20px] -tracking-[0.03em] leading-[28px]'>
          {Tcompetition('check_email')}
        </p>
        <div className='flex flex-col md:flex-row gap-4 mt-4'>
          <Button
            onClick={() => window.location.reload()}
            className='w-full md:w-1/2 bg-secondary hover:bg-secondary/90'
          >
            {Tcompetition('check_status')}
          </Button>
          <Button
            onClick={() => router.push('/')}
            className='w-full md:w-1/2'
            variant='outline'
          >
            {Tcompetition('return_home')}
          </Button>
        </div>
      </div>
    </div>
  );
}
