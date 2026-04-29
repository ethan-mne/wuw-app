import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';
import { type ReactNode } from 'react';

export function Story({
  story,
  image,
  children,
  className,
}: {
  story: string;
  image: string;
  children?: ReactNode;
  className?: string;
}) {
  const Tengagement = useTranslations('engagement');

  return (
    <div className={cn('flex flex-col gap-16 my-[87px]')}>
      <div className='w-full h-full flex gap-3 justify-center md:gap-6 pl-4 md:pl-0'>
        <div className='flex flex-col md:w-4/5 gap-6'>
          <p className='uppercase text-[44px] md:text-[64px] -tracking-[0.05em] font-bold'>
            {Tengagement('their')}{' '}
            <span className='text-secondary'>
              {Tengagement('stories')}
            </span>{' '}
          </p>
          <p className='text-neutral-500 text-[18px] md:text-[24px] -tracking-[0.05em] font-medium md:font-bold'>
            {story}
          </p>
        </div>
      </div>
      <div
        className={cn(
          'w-full h-[520px] flex items-center justify-center bg-center bg-cover relative',
          className,
        )}
        style={{
          backgroundImage: `url(${image})`,
        }}
      >
        <div className='group absolute inset-0 bg-gradient-to-tr from-black to-dark bg-black bg-opacity-20 z-10'></div>
        <div className='w-full h-full z-20'>{children}</div>
      </div>
    </div>
  );
}
