import {
  Green_tag,
  Green_balloon,
  Green_bag,
  Green_crown,
} from '@/components/icons';
import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';
import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';
import { ScaleAnimatedLink } from '@/components/animated-button';
import { useTranslations } from 'next-intl';

export function Cards() {
  const Tengagement = useTranslations('engagement');

  const kidsCards = [
    {
      icon: <Green_tag className='h-8 w-8 ' />,
      title: Tengagement('welcoming'),
      description: Tengagement('minimize_anxiety'),
    },
    {
      icon: <Green_crown className='h-8 w-8 ' />,
      title: Tengagement('improved_comfort'),
      description: Tengagement('lacking_equipment_help'),
    },
    {
      icon: <Green_balloon className='h-8 w-8 ' />,
      title: Tengagement('entertainment'),
      description: Tengagement('in_room_entertainment_organization'),
    },
    {
      icon: <Green_bag className='h-8 w-8 ' />,
      title: Tengagement('financial_support'),
      description: Tengagement('financial_support_to_families'),
    },
  ];

  return (
    <div className='flex flex-col  mt-[72px] md:mt-[144px] '>
      <p className='text-start  md:text-center text-[44px] md:text-[64px] uppercase text-black -tracking-[0.05em] pl-4 md:pl-0 '>
        {Tengagement('what_they_do')}
        <span className='text-secondary'>{Tengagement('for_children')}</span>
      </p>
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4  gap-4 px-4  mt-[58px] md:mt-[161px]'>
        {kidsCards.map((card, index) => (
          <Card
            {...card}
            key={card.title}
            className={`col-span-1 ${
              index % 2 === 0 ? 'left-0 mr-auto' : 'right-0 ml-auto'
            }`}
          />
        ))}
      </div>
      <ScaleAnimatedLink
        href='https://www.associationsuperheros.org/'
        text={Tengagement('make_a_donation')}
        containerStyle='mx-auto mt-[80px]'
      />
    </div>
  );
}

function Card({
  icon,
  title,
  description,
  className,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'h-[306px] max-w-[300px] md:max-w-none  flex flex-col  gap-[34px] leading-relaxed py-6 px-6 shadow-2xl float-end',
        className,
      )}
    >
      {icon}
      <div className='flex flex-col gap-[17px] overflow-hidden '>
        <p className='text-foreground uppercase text-[20px] font-bold -tracking-[0.05em]'>
          {' '}
          {title}
        </p>
        <p className=' text-neutral-500 text-[14px] xs:text-[16px] font-bold -tracking-[0.05em] '>
          {description}
        </p>
      </div>
    </div>
  );
}
