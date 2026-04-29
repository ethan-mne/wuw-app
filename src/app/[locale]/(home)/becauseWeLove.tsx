import { SectionTitle } from '@/components/section-title';
import { useTranslations } from 'next-intl';
import React from 'react';

const BecauseWeLove = () => {
  const Thome = useTranslations('home');
  return (
    <div className='w-full md:w-4/5 lg:self-center pl-4 md:pl-0'>
      <SectionTitle subtitle={Thome('watch_enthusiast')}>
        <p className='text-[#E30F0F]'>{Thome('because_we_love')}</p>
        <p className='text-foreground'>{Thome('everything_about_watches')}</p>
      </SectionTitle>
    </div>
  );
};

export default BecauseWeLove;
