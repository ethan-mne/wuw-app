'use client';

import { Separator } from '@/components/ui/separator';
import { Calender, Cup, Pin } from '@/components/icons';
import { useTranslations } from 'next-intl';

export function WinnerInfo({
  value,
  name,
  date,
}: {
  value: string | null;
  date: string | null;
  name: string | null;
}) {
  const Twinners = useTranslations('winners');
  return (
    <div className='w-full flex justify-between items-center truncate'>
      <div className='flex justify-center items-center gap-1'>
        <Calender className='h-[12.50px] md:h-[16px] w-[12.50px] :w-[16px] fill-[#7C7C7C]' />
        <p className='text-background font-normal text-[10px] xs:text-[12px] md:text-[14px] -tracking-[0.03em] '>
          {Twinners('won')} {date}
        </p>
      </div>
      <Separator className='bg-secondary h-full' orientation='vertical' />
      <div className='flex justify-center items-center gap-1'>
        <Cup className='h-[12.50px] w-[12.50px] md:h-[13.33px] md:w-[13.33px] fill-[#7C7C7C]' />
        <p className='text-background font-normal text-[10px] xs:text-[12px] md:text-[14px]  -tracking-[0.03em] '>
          {Twinners('value')} {value}
        </p>
      </div>
      <Separator className='bg-secondary h-full ' orientation='vertical' />
      <div className='flex justify-center items-center gap-1'>
        <Pin className='h-[14px] w-[12px] md:h-[18px] md:w-[18px] fill-[#7C7C7C] ' />
        <p className='text-background font-normal text-[10px] xs:text-[12px] md:text-[14px] -tracking-[0.03em]  capitalize'>
          {name}
        </p>
      </div>
    </div>
  );
}
