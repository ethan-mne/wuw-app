import { ScaleAnimatedLink } from '@/components/animated-button';
import { SectionTitle } from '@/components/section-title';
import { useTranslations } from 'next-intl';

export const BtnTransled = () => {
  const Tfeed = useTranslations('feed');
  return (
    <ScaleAnimatedLink
      href='/feed'
      text={Tfeed('view_all_articles')}
      containerStyle='self-center mt-[77px] '
    />
  );
};

export const TextTranslated = () => {
  const Thome = useTranslations('home');
  return (
    <SectionTitle subtitle="Whether you're a seasoned watch enthusiast or just beginning your journey into the world of timepieces, our feed is designed to keep you informed and inspired.">
      <p className='text-[#E30F0F]'>{Thome('because_we_love')}</p>
      <p className='text-foreground'>{Thome('everything_about_watches')}</p>
    </SectionTitle>
  );
};
