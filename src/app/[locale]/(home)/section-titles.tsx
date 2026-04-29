import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

export function SectionTitles({
  children,
  subtitle,
  subtitleStyle,
  className,
}: {
  children: ReactNode;
  subtitle: string;
  subtitleStyle?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex h-full w-full flex-col  gap-3 pl-2 md:flex-row md:gap-6 md:pl-0',
        className,
      )}
    >
      <div className='flex flex-1 flex-col  items-start justify-center text-4xl  uppercase  md:items-center'>
        {children}
      </div>
      <div className='flex flex-1  items-center md:justify-center'>
        <p
          className={cn(
            'text-sm lowercase text-neutral-500 md:w-3/4 lg:w-1/2',
            subtitleStyle,
          )}
        >
          {subtitle}
        </p>
      </div>
    </div>
  );
}
