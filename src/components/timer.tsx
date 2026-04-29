'use client';

import { useEffect, useMemo, useState } from 'react';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

type TimeRemaining = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
};

export function Timer({
  start_date,
  className,
  separatorStyle,
}: {
  start_date: Date;
  className?: string;
  separatorStyle?: string;
}) {
  const calculateTimeRemaining = useMemo(() => {
    return () => {
      const timeRemaining = start_date.getTime() - Date.now();

      if (timeRemaining <= 0) {
        // If time has passed, return null
        return null;
      }

      return {
        days: Math.floor(timeRemaining / (1000 * 60 * 60 * 24)),
        hours: Math.floor((timeRemaining / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((timeRemaining / 1000 / 60) % 60),
        seconds: Math.floor((timeRemaining / 1000) % 60),
      };
    };
  }, [start_date]);

  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining | null>();

  // Update time remaining every second
  useEffect(() => {
    setTimeRemaining(calculateTimeRemaining());

    const interval = setInterval(() => {
      setTimeRemaining(calculateTimeRemaining());
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  }, [calculateTimeRemaining]);

  if (!timeRemaining) {
    return null;
  }

  return (
    <div
      className={cn('flex justify-center items-center text-white', className)}
    >
      <div className='flex flex-row justify-start space-x-3   '>
        <div className='flex flex-col items-center justify-start'>
          <div className='text-[18px] md:text-[20px] -tracking-[0.06em] font-bold'>
            {timeRemaining.days}
          </div>
          <div className='text-[9px] md:text-[10.50px] -tracking-[0.06em] font-bold'>
            DAY
          </div>
        </div>
        <Separator
          orientation='vertical'
          className={cn(
            'bg-white h-[14.8px] md:h-[16.54px] mt-2',
            separatorStyle,
          )}
        />
        <div className='flex flex-col items-center '>
          <div className='text-[18px] md:text-[20px] -tracking-[0.06em] font-bold '>
            {timeRemaining.hours}
          </div>
          <div className='text-[9px] md:text-[10.50px] -tracking-[0.06em] font-bold'>
            HOUR
          </div>
        </div>
        <Separator
          orientation='vertical'
          className={cn(
            'bg-white h-[14.8px] md:h-[16.54px] mt-2',
            separatorStyle,
          )}
        />
        <div className='flex flex-col items-center '>
          <div className='text-[18px] md:text-[20px] -tracking-[0.06em] font-bold'>
            {timeRemaining.minutes}
          </div>
          <div className='text-[9px] md:text-[10.50px] -tracking-[0.06em] font-bold'>
            MIN
          </div>
        </div>
        <Separator
          orientation='vertical'
          className={cn(
            'bg-white h-[14.8px] md:h-[16.54px] mt-2',
            separatorStyle,
          )}
        />
        <div className='flex flex-col items-center '>
          <div className='text-[18px] md:text-[20px] -tracking-[0.06em] font-bold'>
            {timeRemaining.seconds}
          </div>
          <div className='text-[9px] md:text-[10.50px] -tracking-[0.06em] font-bold'>
            SEC
          </div>
        </div>
      </div>
    </div>
  );
}
