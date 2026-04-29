'use client';

import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { Globe, Checked } from './icons';
import { locales, type Locale } from '@/config';
import { useRouter, usePathname } from '@/navigation';
import { useLocale } from 'next-intl';
import { cn } from '@/lib/utils';
import { ChevronDownIcon } from 'lucide-react';

export function LocaleSwitcher() {
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale() as Locale;

  //replace the values with the translation
  const languages: Record<Locale, string> = {
    en: 'English',
    es: 'Spanish',
    fr: 'French',
  };

  const visibleLocales = locales.filter((cur) => cur !== 'fr');

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant='ghost'
          className='m-0 border-none bg-transparent p-0 ring-0 ring-offset-0 hover:bg-transparent hover:text-foreground focus:outline-none focus:ring-0 disabled:pointer-events-none disabled:opacity-50'
          aria-label='Switch language'
        >
          <Globe className='block h-5 w-5 lg:hidden' />
          <span className='sr-only'>Switch language</span>
          <div className='mr-0 lg:mr-3 hidden lg:flex lg:items-center lg:gap-2'>
            <p className=' text-foreground text-[16px] font-bold -tracking-[0.03em]'>
              {languages[locale]}{' '}
            </p>
            <ChevronDownIcon className='mt-1 h-5 w-5 text-secondary' />
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end' className=''>
        {visibleLocales.map((cur) => (
          <DropdownMenuItem
            onClick={() => {
              router.replace(pathname, { locale: cur });
            }}
            key={cur}
            className='flex items-center justify-between'
          >
            <p
              className={cn({
                'text-foreground': locale === cur,
                'text-[#898989]': locale !== cur,
              })}
            >
              {languages[cur]}
            </p>
            {locale === cur && <Checked className='h-3 w-3' />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
