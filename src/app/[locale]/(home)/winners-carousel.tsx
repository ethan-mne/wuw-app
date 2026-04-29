import { Tag } from '@/components/icons';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { WinnersVideoPlayer } from '@/components/video-player';
import { ScaleAnimatedLink } from '@/components/animated-button';
import { useTranslations } from 'next-intl';
import type { PublicWinner } from '@/server/public-home-data';

export function WinnersCarousel({
  winners,
}: Readonly<{
  winners: PublicWinner[];
}>) {
  const Thome = useTranslations('home');
  const Twinners = useTranslations('winners');
  return (
    <Carousel
      className='flex w-full max-w-full flex-col gap-[30px] md:gap-[51px] '
      opts={{
        align: 'start',
      }}
    >
      <CarouselContent className='-ml-4 w-full '>
        {winners.map((winner, index) => (
          <CarouselItem
            key={index}
            className='max-w-[248px] pl-4 md:max-w-[373px] md:basis-1/2  lg:basis-1/3 xl:ml-4'
          >
            <div className='group relative h-[374px] md:h-[563px] '>
              {!('id' in winner) ? (
                <WinnersVideoPlayer src={winner.src} />
              ) : (
                <>
                  <Image
                    src={winner.img ?? ''}
                    width={373}
                    height={563}
                    sizes='(min-width: 1280px) 373px, (min-width: 768px) 50vw, 248px'
                    className='h-full w-full object-cover '
                    alt={winner.name ?? 'winner'}
                  />
                  <div className='delay-2000 absolute inset-x-0 bottom-0  z-30 flex h-0 translate-y-full transform items-center justify-center overflow-hidden text-base text-white transition-all duration-700 group-hover:h-auto group-hover:translate-y-0'>
                    <Link
                      target='_blank'
                      rel='noreferrer'
                      href='/competitions'
                      aria-label='Join the next competition'
                      className='flex h-full w-full flex-col '
                    >
                      {/* // winner info */}
                      <div className='flex items-start justify-between gap-3 bg-primary px-3 py-5'>
                        <div className='flex flex-col  justify-center '>
                          <span className='text-xl text-white'>
                            {Thome('winner_of')} {winner.watch}
                          </span>
                          <span className='text-base font-medium text-stone-200'>
                            {winner.name}
                          </span>
                        </div>
                        <div className='flex flex-col justify-center '>
                          <span className='text-xl font-medium text-stone-200'>
                            {winner.value}
                          </span>
                          <span className='text-base font-normal text-stone-200'>
                            {Twinners('value')}
                          </span>
                        </div>
                      </div>
                      {/* next competition */}

                      <div className='flex items-center justify-center gap-3 bg-black px-3 py-5'>
                        <span className='text-xl text-white'>
                          {Thome('join_the_next_competition')}
                        </span>
                        <Tag className='mt-1 h-5 w-5' />
                      </div>
                    </Link>
                  </div>
                </>
              )}
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>
      {/* // carousel controls */}
      <div className='flex  flex-row items-center  justify-end md:justify-center gap-[10px] md:gap-[41px] pr-3 md:pr-0'>
        <CarouselPrevious className='w-[49px] h-[49px] md:w-[58px] md:h-[58px] group border-none bg-white shadow hover:bg-white'>
          <ArrowLeft className='h-[27.08px] w-[27.08px] md:h-[32.05px] md:w-[32.05px] text-primary group-hover:scale-125 duration-200 group-hover:text-secondary' />
        </CarouselPrevious>
        <ScaleAnimatedLink
          href='/winners'
          text={Twinners('view_all_winners')}
          className='hidden md:inline-flex'
        />
        <CarouselNext className='w-[49px] h-[49px] md:w-[58px] md:h-[58px]  group border-none bg-white shadow hover:bg-white'>
          <ArrowRight className='h-[27.08px] w-[27.08px] md:h-[32.05px] md:w-[32.05px] text-primary group-hover:scale-125 duration-200 group-hover:text-secondary' />
        </CarouselNext>
      </div>
    </Carousel>
  );
}
