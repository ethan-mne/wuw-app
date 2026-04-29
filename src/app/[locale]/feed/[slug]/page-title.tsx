import { type ReactNode } from 'react';
import { helvetica } from '@/lib/fonts';

export default function PageTitle({ children }: { children: ReactNode }) {
  return (
    <h1
      className={`text-[45px] md:text-[96px] leading-[56px] md:leading-none mb-10 text-foreground font-bold md:text-center ${helvetica.className}`}
    >
      {children}
    </h1>
  );
}
