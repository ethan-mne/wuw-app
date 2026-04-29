'use client';
import Link from 'next/link';
import { Timer } from '../timer';
import { cn } from '@/lib/utils';
import { buttonVariants } from '../ui/button';
import { ArrowRightIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { addDays } from 'date-fns';

export function StickyTicketFooter({
  start_date,
  ticket_id,
}: {
  start_date?: Date;
  ticket_id?: string;
}) {
  const Thome = useTranslations('home');
  return (
    <div className='fixed bottom-0 z-40 flex w-full flex-col items-center justify-center bg-foreground py-2 md:hidden'>
      <div className='flex w-full items-center justify-between px-4'>
        <div className='flex flex-col items-center'>
          <Timer
            start_date={start_date ?? addDays(new Date(), 3)}
            className='mb-1'
          />
          <p className='text-[10px] text-white/80 italic'>
            {Thome('all_sold')}
          </p>
        </div>
        <Link
          target='_blank'
          rel='noreferrer'
          href='/'
          className={cn(
            buttonVariants({ variant: 'ghost' }),
            'm-0 h-full items-center justify-center gap-2 rounded-none border-none p-0 hover:bg-transparent',
          )}
        >
          <p className='sm:text:sm text-center text-sm text-white md:text-xs lg:text-lg'>
            {Thome('get_your_ticket')}
          </p>
          <ArrowRightIcon
            className='mt-1 h-4 w-4 font-bold lg:h-5 lg:w-5'
            size={10}
            color='#00D273'
          />
        </Link>
      </div>
    </div>
  );
}
