import { cn } from '@/lib/utils';
import Image from 'next/image';
import { Link } from '@/navigation';
import { type ReactNode } from 'react';
import { buttonVariants } from '@/components/ui/button';
import { SectionTitle } from '@/components/section-title';
import { ScaleAnimatedLink } from '@/components/animated-button';
import { useTranslations } from 'next-intl';

export function Charity() {
  const Thome = useTranslations('home');
  return (
    <div className='flex flex-col gap-[164px] lg:gap-[104px]  mt-[88px] md:mt-[212px]'>
      <div className='w-full md:w-4/5 lg:self-center pl-4 md:pl-0'>
        <SectionTitle
          leftSideStyle='pr-0  lg:pr-10 xl:pr-30'
          subtitle={Thome('subtitle3')}
        >
          <p className='text-foreground -tracking-[0.05em]'>
            {Thome('we_believe_in_making_a_difference')}{' '}
          </p>
          <p className='text-secondary -tracking-[0.05em]'>
            {Thome('with_every_tick_of_the_clock')}
          </p>
        </SectionTitle>
      </div>
      <div className='flex flex-col gap-10 md:flex-row md:gap-6 md:max-lg:gap-2 '>
        <CharityCard
          background='https://d9ylgh2z4lcdz.cloudfront.net/charity-children.png'
          className='relative flex-1 px-6 py-12 md:max-md:px-2'
        >
          <div className='flex h-full w-full flex-col items-center justify-between  text-5xl uppercase xl:text-6xl   '>
            <div className='flex flex-row items-start justify-between'>
              <span className='text-secondary'>
                {Thome('we_support_super_heros')}
              </span>
              <Image
                src='/new-images/super-heros.png'
                alt='super heros logo'
                height={130}
                width={130}
                className='absolute -top-28 left-0 lg:relative lg:top-auto  '
              />
            </div>
            <span className='text-background '>
              {Thome('to_help_seriously_ill_children')}
            </span>
          </div>
        </CharityCard>
        <CharityCard
          background='/new-images/charity-fox-ceo.png'
          className='relative hidden flex-1  px-6 py-12 md:flex'
        >
          <div className=' flex flex-col items-center justify-between  text-5xl  uppercase xl:text-6xl '>
            <div className='flex flex-col'>
              <span className='text-background '>
                {Thome('each_ticket_sold_support_the_michael_j_fox_foundation')}
              </span>
              <span className='text-secondary'>
                {Thome('for_parkinson_research')}
              </span>
            </div>
          </div>
          <Image
            src='/new-images/charity-fox-logo.png'
            alt='fox charity logo'
            height={136}
            width={136}
            className='absolute bottom-0 left-0 right-0 mx-auto'
          />
        </CharityCard>
        {/* <ScaleAnimatedLink
          href='/engagement'
          text='More about our engagement'
          className='inline-flex md:hidden'
          containerStyle='self-center'
        /> */}
      </div>
    </div>
  );
}

export function CharityCard({
  children,
  background,
  className,
}: {
  children?: ReactNode;
  background: string;
  className?: string;
}) {
  const Thome = useTranslations('home');
  return (
    <div
      className={cn(
        'group relative flex h-[729px] w-full items-center justify-center bg-cover bg-center',
        className,
      )}
      style={{
        backgroundImage: `url(${background})`,
      }}
    >
      <div className='to-dark group absolute inset-0 z-10 bg-black bg-opacity-50 bg-gradient-to-tr from-black group-hover:bg-white group-hover:bg-opacity-40 group-hover:from-transparent group-hover:to-transparent '></div>
      {/* <div className='absolute inset-x-0 bottom-0 z-30 flex h-0 translate-y-full transform items-center justify-center overflow-hidden bg-black text-base text-white transition-all duration-300 group-hover:h-20 group-hover:translate-y-0'>
        <Link
          target='_blank'
          rel='noreferrer'
          href='/engagement'
          className='flex h-full w-full items-center justify-center'
        >
          {Thome('learn_more_about_our_engagements')}
        </Link>
      </div> */}
      <div className='z-20 h-full w-full'>{children}</div>
    </div>
  );
}
