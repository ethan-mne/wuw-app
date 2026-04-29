'use client';
import { Timer } from '@/components/timer';
import {
  Carousel,
  type CarouselApi,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import { Separator } from '@/components/ui/separator';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { type CompetitionInterface } from '@/lib/interfaces';
import { cn } from '@/lib/utils';
import { formatPrice } from '@/lib/formaters';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { formatDate } from 'date-fns';
import { JoinNextCompetitionButton } from '@/components/animated-button';
import { useTranslations } from 'next-intl';

export function EnterCompetitionCarousel({
  competitions,
}: Readonly<{
  competitions: CompetitionInterface[];
}>) {
  const isDesktop = useMediaQuery('(min-width: 768px)');
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const [count, setCount] = useState(0);
  const Thome = useTranslations('home');
  useEffect(() => {
    if (!api) {
      return;
    }

    setCount(api.scrollSnapList().length);
    setCurrent(api.selectedScrollSnap() + 1);

    api.on('select', () => {
      setCurrent(api.selectedScrollSnap() + 1);
    });
  }, [api]);

  function generateDataForCompetition(competition: CompetitionInterface) {
    const watchValue = competition.price;
    const entryPrice = competition.ticket_price;

    return [
      { label: Thome('watch_value'), value: `${formatPrice(watchValue)}` },
      { label: Thome('entry_price'), value: `${formatPrice(entryPrice)}` },
      {
        label: isDesktop ? Thome('draw_date') : Thome('max_tickets'),
        value: isDesktop
          ? formatDate(competition.end_date, 'dd/MM/yyyy')
          : competition.total_tickets,
      },
    ];
  }

  if (isDesktop) {
    return (
      <>
        <div className='w-full flex justify-center items-center gap-6 flex-wrap'>
          {competitions.map((comp, index) => (
            <CompetitionWatch
              key={index}
              active={current === index + 1}
              number={index + 1}
              watch={comp.name}
            />
          ))}
        </div>
        <Carousel
          setApi={setApi}
          className='max-w-full flex w-full flex-col gap-6 mt-[58px]'
          opts={{
            align: 'start',
          }}
        >
          <CarouselContent className='w-full'>
            {competitions.map((comp) => (
              <CarouselItem
                key={comp.name}
                className='flex w-full items-center justify-center'
              >
                <div className='flex h-[528px] w-full gap-3  lg:w-4/5 '>
                  <Image
                    src={
                      comp?.Watches?.images_url[0]?.url ?? '/defaultImageUrl'
                    }
                    alt={comp.name}
                    width={0}
                    height={0}
                    sizes='(min-width: 1024px) 40vw, 100vw'
                    className='flex-1  object-cover  '
                  />
                  <div className='1 flex flex-1 flex-col'>
                    <div className='border-b--2 flex flex-none items-center justify-between border-b border-b-foreground pb-[26px]'>
                      <Timer
                        start_date={comp.end_date}
                        className='text-foreground'
                        separatorStyle='bg-foreground'
                      />
                      <div className='flex flex-col items-end justify-center'>
                        <p className='text-[20px] -tracking-normal font-bold text-foreground'>
                          {comp.total_tickets}
                        </p>
                        <p className='text-[16px] -tracking-[0.02em] font-normal text-foreground'>
                          {Thome('maxTickets')}
                        </p>
                      </div>
                    </div>
                    <div className='flex flex-1 flex-col justify-center md:max-xl:gap-[70px] xl:gap-[93px]'>
                      <h2 className='text-[36px] -tracking-[0.06em] font-bold text-foreground'>
                        {comp.name}
                      </h2>
                      <div className='flex flex-col justify-center gap-[47px]'>
                        <div className='flex  gap-[42px]'>
                          {generateDataForCompetition(comp).map((item) => (
                            <div
                              className='flex items-center gap-3'
                              key={item.label}
                            >
                              <Separator
                                orientation='vertical'
                                className='h-full bg-primary  text-foreground'
                              />
                              <div className='flex flex-col '>
                                <p className='text-[32px] -tracking-normal font-bold text-foreground'>
                                  {item.value}
                                </p>
                                <p className='text-[16px] -tracking-normal font-normal text-foreground'>
                                  {item.label}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                        <JoinNextCompetitionButton
                          href={
                            `/competitions/${comp.id}` as '/competitions/:id'
                          }
                          text={Thome('join_the_next_competition')}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          {/* // carousel controls */}
          <div className='flex items-center justify-center gap-6 '>
            <CarouselPrevious className='group border-none bg-white shadow hover:bg-white'>
              <ArrowLeft className='h-4 w-4 text-primary group-hover:scale-150 group-hover:text-secondary' />
            </CarouselPrevious>
            <div className='flex max-w-[30%] flex-wrap gap-4'>
              {Array.from({ length: count }, (_, i) => (
                <EnterCompetitionCarouselPagination
                  active={current === i + 1}
                  key={i}
                />
              ))}
            </div>
            <CarouselNext className='group border-none bg-white shadow hover:bg-white'>
              <ArrowRight className='h-4 w-4 text-primary group-hover:scale-150 group-hover:text-secondary' />
            </CarouselNext>
          </div>
        </Carousel>
      </>
    );
  }

  return (
    <div className='flex w-full flex-col items-center justify-center gap-4 '>
      {competitions.map((comp) => (
        <div className='flex w-full flex-col gap-[40px]' key={comp.name}>
          <Image
            src={comp?.Watches?.images_url[0]?.url ?? 'defaultImageUrl HERE'}
            alt={comp.name}
            width={0}
            height={383}
            sizes='100vw'
            className='w-full flex-1 object-cover'
          />
          <div className='flex flex-1 flex-col gap-[23px] xs:px-4'>
            <div className='flex flex-1  items-center border-b border-b-foreground pb-[23px]'>
              <Timer
                start_date={comp.end_date}
                className='text-foreground'
                separatorStyle='bg-foreground'
              />
            </div>
            <div className='flex w-full flex-col justify-around gap-[44px] '>
              <h2 className='text-[26px] font-bold  text-foreground -tracking-[0.06em]'>
                {comp.name}
              </h2>
              <div className='flex flex-col justify-between gap-8'>
                <div className='flex  gap-3'>
                  {generateDataForCompetition(comp).map((item, index) => (
                    <div className='flex items-center gap-3 ' key={index}>
                      <Separator
                        orientation='vertical'
                        className='h-full bg-primary  text-foreground'
                      />
                      <div className='flex flex-col '>
                        <p className='text-[25.41px] font-bold  text-foreground -tracking-normal'>
                          {item.value}
                        </p>
                        <p className='text-[12.71px] font-medium text-zinc-700 -tracking-normal'>
                          {item.label}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                <JoinNextCompetitionButton
                  href={`/competitions/${comp.id}` as '/competitions/:id'}
                  text={Thome('join_the_next_competition')}
                  containerStyle='mt-[72px] self-center '
                />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function EnterCompetitionCarouselPagination({
  active,
}: Readonly<{ active: boolean }>) {
  return (
    <div
      className={cn('h-3 w-12 rounded-full bg-neutral-200', {
        'bg-foreground': active,
      })}
    />
  );
}

function CompetitionWatch({
  watch,
  number,
  active,
}: Readonly<{
  watch: string;
  number: number;
  active: boolean;
}>) {
  return (
    <div className='w-[377px] h-[65px] flex justify-center items-center shadow-[4px_-3.81px_28.55px_rgba(0,0,0,0.1)] bg-background px-12'>
      <span
        className={cn(
          'font-bold text-[18px] text-foreground -tracking-[0.05em] truncate  capitalize',
          {
            'text-secondary': active,
          },
        )}
      >
        #{number} {watch}
      </span>
    </div>
  );
}
