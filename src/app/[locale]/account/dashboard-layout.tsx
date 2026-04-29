'use client';

import { PastCompetitions } from '@/components/competitions/past-competitions';
import { TopRankedTitle } from '@/components/top-ranked-title';
import type { CompetitionInterface } from '@/lib/interfaces';
import { usePathname } from '@/navigation';

export function DahsboardLayout({
  completedCompetitions,
}: {
  completedCompetitions: CompetitionInterface[];
}) {
  const pathname = usePathname();
  if (pathname.includes('account/dashboard')) {
    return (
      <div>
        <TopRankedTitle
          text='#Top-Ranked Globally for Unbeatable Winning Chances'
          className='hidden md:flex'
        />
        <TopRankedTitle
          text='#only those who play end up winning'
          className='flex md:hidden'
        />
        <PastCompetitions
          competitions={completedCompetitions}
          className='pl-4 md:pl-0'
          withButton={false}
        />
        <p className='hidden md:block text-center  font-medium uppercase tracking-[0.45em] text-background text-[24px] bg-foreground py-[139px]'>
          #only those who play end up winning
        </p>
      </div>
    );
  }
  return null;
}
