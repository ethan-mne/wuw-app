import { cn } from '@/lib/utils';
import { type ReactNode } from 'react';

export function LayoutWrapper({
  children,
  className,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn('md:container md:max-w-screen-2xl', className)}>
      {children}
    </div>
  );
}
