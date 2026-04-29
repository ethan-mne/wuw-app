export const dynamic = 'force-static';

import { LayoutWrapper } from '@/components/layout-wrapper';
import { InstagramTopBanner } from '../(home)/instagram-top-banner';
import { Story } from './strory';
import { Cards } from './cards';
import { FoxCharity } from './fox-charity';
import { ContactUs } from './contact-us';
import { cn } from '@/lib/utils';
import { TopSection } from '@/components/top-section';
import Image from 'next/image';
import { ScaleAnimatedLink } from '@/components/animated-button';
import { getTranslations } from 'next-intl/server';
import { getPublicHomeStats } from '@/server/public-home-data';

import { unstable_setRequestLocale } from 'next-intl/server';

export default async function Engagement({
  params: { locale },
}: {
  params: { locale: string };
}) {
  unstable_setRequestLocale(locale);
  const [Teng, Thome, Tcomp, publicStats] = await Promise.all([
    getTranslations('engagement'),
    getTranslations('home'),
    getTranslations('competition'),
    getPublicHomeStats(),
  ]);
  return (
    <div className=''>
      {/* instagram banner */}
      <InstagramTopBanner instagramCount={publicStats.instagramCount} />
      {/* top section */}
      <TopSection bgImage='/new-images/engagement-children.png'>
        <div className='w-full flex flex-col  lg:flex-row gap-[58px] md:gap-0  mt-3 md:mt-6'>
          <div className='flex-1  justify-end text-[40px] xs:text-[52px] lg:text-[64px] uppercase'>
            <div className=' pr-0  lg:pr-20 xl:pr-40 leading-normal'>
              <p className='text-foreground -tracking-[0.05em] font-bold '>
                {Teng('our')}
              </p>
              <p className='text-secondary -tracking-[0.05em] font-bold '>
                {Teng('commitment')}
              </p>
              <p className='text-foreground -tracking-[0.05em] font-bold '>
                {Teng('extends_beyond_competition')}
              </p>
            </div>
          </div>
          <div className='flex-1 text-ellipsis'>
            <div className=''>
              <p className='text-[18px] md:text-[24px]   text-[#7C7C7C]  -tracking-[0.05em] font-medium md:font-bold '>
                {Teng('dedicating_a_significant_portion')}{' '}
                <span className='hidden md:block'>
                  {Teng('creating_winners_fostering_community')}
                </span>
              </p>
            </div>
          </div>
          <span className='text-foreground  text-[20px]  md:hidden -tracking-[0.05em] font-bold'>
            {Teng('creating_winners_fostering_community')}
          </span>
        </div>
      </TopSection>

      <LayoutWrapper className='mt-[83px] md:mt-[130px]'>
        <div
          className={cn(
            'w-full h-[729px] flex items-center justify-center bg-center bg-cover relative',
          )}
          style={{
            backgroundImage: `url(/new-images/charity-children-2.png)`,
          }}
        >
          <div className='group absolute inset-0 bg-gradient-to-tr from-black to-dark bg-black bg-opacity-15  '></div>
          <div className='w-full h-full z-20 uppercase  flex flex-col items-center gap-10 md:gap-15 pt-5 '>
            <Image
              src='/new-images/super-heros.png'
              alt='super heros logo'
              height={130}
              width={130}
              className=''
            />
            <span className='text-secondary text-center text-[41px] md:text-[61px] -tracking-[0.05em] font-medium md:font-bold'>
              {Teng('we_support')}{' '}
              <span className='text-[51px] md:text-[61px]'>
                {Tcomp('superhero')}
              </span>
            </span>
            <span className='text-background text-center md:w-4/5 text-[41px] md:text-[51px] lg:text-[61px] -tracking-[0.05em] '>
              {Thome('to_help_seriously_ill_children')}
            </span>
          </div>
        </div>
        {/* story 1 */}
        <Story
          className='h-[405px] md:h-[520px]'
          image='/new-images/engagement-story-1.png'
          story={Teng('superheroes_association')}
        />
        {/* cards */}
        <Cards />
        {/* charity fox */}
        <FoxCharity className='mt-[144px] mb-0' />
        {/* story 2 */}
        <div className='flex flex-col '>
          <Story
            className='hidden md:flex'
            image='/new-images/engagement-story-2.png'
            story={Teng('mjff_exists_for_one_reason')}
          >
            <div className='w-full h-full  justify-center items-center pl-2 md:pl-0 flex'>
              <div className='flex flex-col text-[41px] md:text-[51px] lg:text-[61px] text-white md:w-4/5 lg:w-3/5 -tracking-[0.05em] leading-none'>
                <p className=' uppercase   '>{Teng('the_foundation_raised')}</p>
                <p className=' uppercase  text-[#F88000]'>
                  {Teng('over_1_billion')}
                </p>
                <p className='uppercase '>
                  {Teng('funded_in_research_programs_to_date')}
                </p>{' '}
              </div>
            </div>
          </Story>
          <ScaleAnimatedLink
            href='https://www.michaeljfox.org/'
            text={Teng('make_a_donation')}
            containerStyle='mx-auto'
          />
        </div>

        {/* contact us section */}
        <ContactUs />
      </LayoutWrapper>
    </div>
  );
}
