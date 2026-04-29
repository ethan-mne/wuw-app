import { useCallback, useEffect, useState } from 'react';
// import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { SwipeAnimatedButton } from '@/components/animated-button';
import { Button } from '@/components/ui/button';
import { useCheckoutSteps } from '@/store/use-checkout-steps';
import { calculateTotal, cn } from '@/lib/utils';
import { TicketQuantity } from './ticket-quantity';
import { useCart } from '@/store/use-cart';
import { useTranslations } from 'next-intl';
import { formatPrice } from '@/lib/formaters';
import type { CompetitionInterface } from '@/lib/interfaces';

export function ConnoisseurChallengeStep({
  competition,
}: Readonly<{
  competition: CompetitionInterface;
}>) {
  // const router = useRouter();
  const [timer, setTimer] = useState(40);
  const [difficulty, setDifficulty] = useState(0);
  const questionImgs = [
    {
      img: '/new-images/new-rolex_sky_dweller.jpeg',
      name: 'Rolex Sky-Dweller',
    },
    {
      img: '/new-images/ROLEX_COSMOGRAPH_DAYTONA_40MM_-_PANDA.png',
      name: 'Rolex Daytona Panda',
    },
    {
      img: '/new-images/Audemars_Piguet_Royal_Oak.png',
      name: 'Audemars Royal Oak',
    },
    {
      img: '/new-images/ROLEX_SUBMARINER_40MM_-_HULK_DIAMOND__EMERALD.jpg',
      name: 'Rolex Hulk',
    },
  ];
  const [currentQuestion, setCurrentQuestion] = useState(
    questionImgs[Math.floor(Math.random() * questionImgs.length)],
  );
  const { incStep } = useCheckoutSteps();
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [hasAnswered, setHasAnswered] = useState(false);

  const { tickets } = useCart();
  const { setChallengeAnswer } = useCheckoutSteps();
  const Tcart = useTranslations('cart');
  const Tcompetition = useTranslations('competition');

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimer((prevTimer) => {
        if (prevTimer === 1) {
          clearInterval(interval);
          handleTimeUp();
          return prevTimer;
        }
        return prevTimer - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [currentQuestion]);

  const handleTimeUp = () => {
    if (!hasAnswered) {
      setChallengeAnswer(false);
      incStep();
    }
  };

  const handleChoice = (name: string) => {
    if (hasAnswered) return;
    setSelectedAnswer(name);
    setHasAnswered(true);
    if (currentQuestion?.name === name) {
      setChallengeAnswer(true);
    } else {
      setChallengeAnswer(false);
    }
    incStep();
  };

  const getBlurClass = useCallback(() => {
    switch (difficulty) {
      case 2:
        return 'blur-[10px]';
      case 3:
        return 'blur-[15px]';
      default:
        return 'blur-[5px]';
    }
  }, [difficulty]);

  return (
    <div className='w-full flex flex-col justify-center items-center'>
      <div className='w-full h-[189px] md:hidden'>
        <Image
          src={competition.Watches?.images_url[0]?.url ?? '/Not_available'}
          alt={competition.Watches?.model ?? '/Not_available'}
          width={0}
          height={0}
          sizes='100vw'
          className='w-full h-full object-cover object-center'
        />
      </div>
      <div className='w-full lg:w-4/5 flex flex-col self-center items-start md:items-center gap-4 px-4 md:px-0'>
        <div className='mt-[29px] flex flex-col md:hidden'>
          <p className='text-[#898989] text-[16px] md:text-[18px]'>
            {Tcompetition('win_the')}
          </p>
          <p className='uppercase text-[24px]  md:text-[37px] tracking-tighter'>
            {competition.name}
          </p>
        </div>
        <p className='hidden text-[32px] text-black font-bold text-center md:block  -tracking-[0.03em]'>
          {Tcompetition('what_watch_is_this')}
        </p>
        <p className='font-medium text-[16px] md:hidden -tracking-normal'>
          {Tcompetition('what_mythic_watch_in_pic')}
        </p>
        <div className='text-2xl font-bold'>Time remaining: {timer}s</div>
        <div
          className={cn(
            `w-full h-[172px] md:h-[250px] flex items-center justify-center bg-center bg-cover relative mt-[32px] md:mt-0`,
            getBlurClass(),
          )}
          style={{
            backgroundImage: `url(${currentQuestion?.img})`,
          }}
        >
          <div className='absolute inset-0 grid grid-cols-3 grid-rows-3 z-10'>
            {Array.from({ length: 9 }).map((_, index) => (
              <div key={index} className='flex items-center justify-center'>
                <span className='text-black text-lg font-bold opacity-40'>
                  winuwatch
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className='mx-auto w-full grid grid-cols-2 md:flex md:flex-wrap justify-between gap-2 '>
          {questionImgs.map((answer) => (
            <Answer
              {...answer}
              key={answer.name}
              onClick={() => handleChoice(answer.name)}
              selected={selectedAnswer === answer.name}
            />
          ))}
        </div>
        <div className='flex items-baseline gap-4 md:hidden'>
          <TicketQuantity remaining_tickets={competition.remaining_tickets} />
          <p className='text-[16px] -tracking-normal text-foreground'>
            {Tcart('total').toLowerCase()}:
          </p>
          <p className='text-[22px] -tracking-normal font-bold text-foreground'>
            {formatPrice(
              calculateTotal(tickets, competition.ticket_price).total,
            )}
          </p>
        </div>
        <SwipeAnimatedButton
          disabled={!hasAnswered}
          className='self-center lg:self-end mt-6'
          text={'Continue to the last step'}
          onClick={() => incStep()}
        />
      </div>
    </div>
  );
}

const Answer = ({
  name,
  onClick,
  selected,
}: Readonly<{
  name: string;
  onClick: () => void;
  selected: boolean;
}>) => (
  <Button
    className={cn(
      'h-[60px] lg:h-[102px] bg-foreground hover:bg-foreground text-white hover:text-secondary rounded-none text-[12px] lg:text-[18px] font-bold -tracking-[0.03em] w-full sm:w-[170px] lg:max-w-[256px] p-0 px-2 flex-auto',
      {
        'bg-secondary hover:bg-secondary hover:text-white': selected,
      },
    )}
    onClick={onClick}
  >
    <span>{name}</span>
  </Button>
);
