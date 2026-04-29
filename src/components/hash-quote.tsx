import { cn } from '@/lib/utils';
import { type ReactNode } from 'react';

export function HashQuote({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex h-[280px] w-full items-center justify-center bg-cover bg-center md:h-[479px]',
        className,
      )}
      style={{
        backgroundImage: `url(https://d9ylgh2z4lcdz.cloudfront.net/upcoming-bg.png)`,
      }}
    >
      {children}
    </div>
  );
}

// <LayoutWrapper>
// <p className='text-center text-base font-medium uppercase tracking-[10.80px] text-background md:text-3xl'>
//     #Top-Ranked Globally for Unbeatable Winning Chances
// </p>
// </LayoutWrapper>
