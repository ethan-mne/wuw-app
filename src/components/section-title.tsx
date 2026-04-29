import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

export function SectionTitle({
  children,
  subtitle,
  className,
  subtitleStyle,
  leftSideStyle,
}: Readonly<{
  children: ReactNode;
  subtitle: string;
  className?: string;
  subtitleStyle?: string;
  leftSideStyle?: string;
}>) {
  return (
    <div
      className={cn(
        'w-full flex flex-col  lg:flex-row lg:items-center gap-4 ',
        className,
      )}
    >
      <div className='flex-1 text-[40px] xs:text-[52px] lg:text-[64px] uppercase'>
        <div className={cn('pr-0  lg:pr-20 xl:pr-40', leftSideStyle)}>
          {children}
        </div>
      </div>
      <div className='flex-1 text-ellipsis'>
        <div className='pl-0  lg:pr-10 xl:pl-10 '>
          <p
            className={cn(
              'text-[26px] text-zinc-600 lg:text-zinc-700',
              subtitleStyle,
            )}
          >
            {subtitle}
          </p>
        </div>
      </div>
    </div>
  );
}
