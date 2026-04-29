import { Link } from '@/navigation';
import { useTranslations } from 'next-intl';
import { HeaderLogo } from './header-logo';

export function MainNav() {
  const t = useTranslations('navitems');

  return (
    <div className='flex w-full justify-center md:justify-start '>
      <Link
        href='/'
        className='flex justify-center items-center md:mr-6 '
        aria-label='Go to homepage'
      >
        <HeaderLogo />
      </Link>
      <nav className='hidden items-center gap-3 text-[16px]  md:flex md:gap-3 lg:gap-6 font-bold -tracking-[0.03em]   '>
        <Link
          href='/howtoplay'
          className='font-helve group  text-foreground relative '
        >
          {t('howto')}
          <span className='absolute left-1/2 -bottom-1.5 w-0 h-0 bg-black transition-all duration-300 transform -translate-x-1/2 group-hover:w-full group-hover:-ml-1/2 group-hover:h-[2px]'></span>
        </Link>
        <Link
          href='/winners'
          className='font-helve group  text-foreground relative '
        >
          {t('winners')}
          <span className='absolute left-1/2 -bottom-1.5 w-0 h-0 bg-black transition-all duration-300 transform -translate-x-1/2 group-hover:w-full group-hover:-ml-1/2 group-hover:h-[2px]'></span>
        </Link>
        {/* <Link
          href='/engagement'
          className='font-helve group  text-foreground relative '
        >
          {t('engage')}
          <span className='absolute left-1/2 -bottom-1.5 w-0 h-0 bg-black transition-all duration-300 transform -translate-x-1/2 group-hover:w-full group-hover:-ml-1/2 group-hover:h-[2px]'></span>
        </Link> */}
        <Link
          href='/feed'
          className='font-helve group  text-foreground relative  md:max-lg:hidden'
        >
          {t('feed')}
          <span className='absolute left-1/2 -bottom-1.5 w-0 h-0 bg-black transition-all duration-300 transform -translate-x-1/2 group-hover:w-full group-hover:-ml-1/2 group-hover:h-[2px]'></span>
        </Link>
        <Link
          href='/faq'
          className='font-helve group  text-foreground relative md:max-lg:hidden '
        >
          {t('faq')}
          <span className='absolute left-1/2 -bottom-1.5 w-0 h-0 bg-black transition-all duration-300 transform -translate-x-1/2 group-hover:w-full group-hover:-ml-1/2 group-hover:h-[2px]'></span>
        </Link>
        <Link
          href='/about-us'
          className='font-helve group  text-foreground relative md:max-xl:hidden '
        >
          {t('about')}
          <span className='absolute left-1/2 -bottom-1.5 w-0 h-0 bg-black transition-all duration-300 transform -translate-x-1/2 group-hover:w-full group-hover:-ml-1/2 group-hover:h-[2px]'></span>
        </Link>
        <Link
          href='/contact-us'
          className='font-helve group  text-foreground relative md:max-xl:hidden '
        >
          {t('contact us')}
          <span className='absolute left-1/2 -bottom-1.5 w-0 h-0 bg-black transition-all duration-300 transform -translate-x-1/2 group-hover:w-full group-hover:-ml-1/2 group-hover:h-[2px]'></span>
        </Link>
      </nav>
    </div>
  );
}
