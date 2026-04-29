import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { ScaleAnimatedLink } from '@/components/animated-button';

export function ContactUs() {
  const Tcharity = useTranslations('charity');
  const Tengagement = useTranslations('engagement');

  return (
    <div className=' flex flex-col gap-10 mt-[144px] md:mt-[206px] mb-[145px] md:mb-[171px]'>
      <div className='flex flex-col  gap-2  pl-4 md:pl-0 items-start md:items-center'>
        <p className='text-[40px] xs:text-[48px] uppercase text-black -tracking-[0.05em]'>
          {Tengagement('are_you_a')}{' '}
          <span className='text-[#DF5D94]'>
            {Tengagement('charitable_associations')}
          </span>
        </p>
        <p className='text-neutral-500 text-[20px] md:text-[24px]'>
          {Tcharity('beinlist').toLowerCase()}
        </p>
      </div>
      <ScaleAnimatedLink
        href='mailto:info@winuwatch.com?subject=Contact from Website'
        text={Tcharity('contactus').toLowerCase()}
        containerStyle='mx-auto'
      />
    </div>
  );
}
