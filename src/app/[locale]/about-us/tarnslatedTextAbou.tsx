import { HashQuote } from '@/components/hash-quote';
import { LayoutWrapper } from '@/components/layout-wrapper';
import { SectionTitle } from '@/components/section-title';
import { useTranslations } from 'next-intl';
import Image from 'next/image';

const TarnslatedTextAbout = () => {
  const Tabout = useTranslations('about_us');

  return (
    <>
      <LayoutWrapper className=' flex lg:justify-center '>
        <div className='w-full md:w-11/12 '>
          <SectionTitle
            subtitleStyle='text-[18px] md:text-[26px]'
            subtitle={Tabout('family_owned_company')}
          >
            <p className='text-foreground'>
              {' '}
              {Tabout(
                'winuwatch_stands_as_a_testament_to_the_passion_and_commitment_of',
              )}{' '}
              <span className='text-secondary'>
                {Tabout('our_family_owned_business')}
              </span>
            </p>
          </SectionTitle>
        </div>
      </LayoutWrapper>
      <Image
        src={'/new-images/about-us.png'}
        alt='watches'
        width={0}
        height={0}
        sizes='100vw'
        className='w-full h-[525px] my-20 object-cover'
      />
      <LayoutWrapper className=' flex lg:justify-center '>
        <div className='flex flex-col md:w-4/5 gap-6 my-10'>
          <p className='uppercase text-[44px] md:text-[64px]'>
            {Tabout('top_ranked_globally_for')}{' '}
            <span className='text-secondary'>
              {Tabout('unbeatable_winning_chances')}
            </span>{' '}
          </p>
          <p className='text-neutral-500 text-[18px] md:text-[24px] '>
            {Tabout('with_great_pride')}
          </p>
        </div>
      </LayoutWrapper>
      <HashQuote className='my-20'>
        <p className='text-center text-base font-medium uppercase tracking-[10.80px] text-background md:text-3xl'>
          {Tabout('only_those_who_play_end_up_winning')}
        </p>
      </HashQuote>
    </>
  );
};

export default TarnslatedTextAbout;
