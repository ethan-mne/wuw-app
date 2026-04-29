'use client';

import { useMediaQuery } from '@/hooks/useMediaQuery';
import { MainLogoGreen, Winuwatch } from './icons';

export function HeaderLogo() {
  const isDesktop = useMediaQuery('(min-width: 768px)');

  if (isDesktop) return <MainLogoGreen />;

  return <Winuwatch className='w-[141.33px] h-[17.91px]' />;
}
