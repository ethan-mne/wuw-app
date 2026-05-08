'use client';

import Image from 'next/image';
import { MainNav } from './main-nav';
import { Bag, Lightbag, Profile } from './icons';
import { MobileNav } from './mobile-nav';
import { useTranslations } from 'next-intl';
import { LocaleSwitcher } from './locale-switcher';
// import { getServerAuthSession } from '@/server/auth'; // Removed server-side auth
import { useSession } from 'next-auth/react'; // Added client-side auth
import { Link as NextLink } from '@/navigation';
import Link from 'next/link';
import { SignOut } from '@/components/signout';

export function Header() {
  const t = useTranslations('navitems');
  const { data: session } = useSession();
  return (
    <header className='sticky top-0 z-50 w-full bg-white/95'>
      <div className='w-full bg-black flex items-center justify-center h-10 pb-1'>
        <Image
          src='/apple-pay-logo.svg'
          alt='Apple Pay'
          width={40}
          height={20}
          priority
          className='mr-2'
        />
        <span className='text-white text-sm'>
          Apple Pay is available on winuwatch!
        </span>
      </div>
      <div className='container flex h-14 max-w-screen-2xl items-center justify-between '>
        <div className='flex  space-x-3 md:hidden md:flex-1'>
          <Link href='/' className='' aria-label='Open cart'>
            <Lightbag className='h-5 w-5' />
          </Link>
          {!session ? (
            <Link
              href='/api/auth/signin'
              className=' text-foreground'
              aria-label='Sign in'
            >
              <Profile className='h-5 w-5 ' />
            </Link>
          ) : (
            <NextLink
              href={session ? '/account/profile' : '/api/auth/signin'}
              className=''
              aria-label='Open profile'
            >
              <Profile className='h-5 w-5 ' />
            </NextLink>
          )}
        </div>
        <MainNav />
        <div className='flex items-center  justify-between space-x-2 md:flex-1 md:justify-end'>
          <LocaleSwitcher />
          {!session ? (
            <nav className='hidden items-center  space-x-2 text-[16px]  md:flex '>
              <Link href='/api/auth/signin' className=' text-foreground'>
                {t('login')}
              </Link>
              <span className=' text-foreground'>|</span>
              <Link href='/api/auth/signin' className=' text-foreground'>
                {t('register')}
              </Link>
              <Link href='/' className='' aria-label='Open cart'>
                <Bag className='ml-3 h-4 w-4 lg:h-5 lg:w-5 ' />
              </Link>
            </nav>
          ) : (
            <nav className='hidden items-center  space-x-2  md:flex text-[16px] font-bold -tracking-[0.03em] '>
              <NextLink href={`/account/profile`} className='text-foreground'>
                {t('account_profile')}
              </NextLink>
              <span className='text-foreground'>|</span>
              <SignOut />
              <Link href='/' className='' aria-label='Open cart'>
                <Bag className='ml-3 h-4 w-4 lg:h-5 lg:w-5 ' />
              </Link>
            </nav>
          )}
          <MobileNav session={session} />
        </div>
      </div>
    </header>
  );
}
