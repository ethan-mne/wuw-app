import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';
import Image from 'next/image';

export function FoxCharity({ className }: { className?: string }) {
  const Tengagement = useTranslations('engagement');
  const Thome = useTranslations('home');
  return (
    <div
      className={cn(
        'w-full h-[729px] flex items-center justify-center bg-center bg-cover relative my-10',
        className,
      )}
      style={{
        backgroundImage: `url(/new-images/charity-fox-ceo.png)`,
      }}
    >
      <div className='group absolute inset-0 bg-gradient-to-tr from-black to-dark bg-black bg-opacity-15  '></div>
      <div className='w-full h-full z-20 uppercase text-[41px] md:text-[61px] flex flex-col items-center justify-center gap-10 md:justify-around md:gap-0'>
        <Image
          src='/new-images/charity-fox-logo.png'
          alt='fox logo'
          height={163}
          width={163}
          className=''
        />
        <span className='text-background text-center md:w-4/5 -tracking-[0.05em]'>
          {Tengagement('support_michael_j_fox_foundation')}
        </span>
        <span className='text-secondary text-center -tracking-[0.05em]'>
          {Thome('for_parkinson_research')}
        </span>
      </div>
    </div>
  );
}
