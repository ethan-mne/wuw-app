'use client';

import { Timer } from '@/components/timer';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { useCheckoutSteps } from '@/store/use-checkout-steps';
import { useTranslations } from 'next-intl';

export function HeaderTimer({ end_date }: { end_date: Date }) {
  const { step } = useCheckoutSteps();
  const isDesktop = useMediaQuery('(min-width: 768px)');
  const Thome = useTranslations('home');

  if (step === 4 && !isDesktop) return null;
  return (
    <div className='sticky top-14 w-full bg-foreground py-4 z-40'>
      <div className='flex flex-col items-center justify-center'>
        <Timer start_date={end_date} className='mb-1' />
        <p className='text-[12px] text-white/80 italic'>{Thome('all_sold')}</p>
      </div>
    </div>
  );
}
