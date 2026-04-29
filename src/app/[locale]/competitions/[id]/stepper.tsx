import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';

export function Stepper({
  active,
  className,
}: {
  active: number;
  className?: string;
}) {
  const Tcart = useTranslations('cart');

  const steps = [
    {
      name: Tcart('select_your_ticket'),
      step: 1,
    },
    {
      name: Tcart('connoisseur_challenge'),
      step: 2,
    },
    {
      name: Tcart('checkout'),
      step: 3,
    },
  ];
  return (
    <div
      className={cn(
        'flex items-center justify-between w-full lg:w-4/5 self-center',
        className,
      )}
    >
      {steps.map((step) => (
        <Step {...step} key={step.step} active={active} />
      ))}
    </div>
  );
}

function Step({
  step,
  name,
  active,
}: {
  step: number;
  name: string;
  active: number;
}) {
  return (
    <div className='relative flex-grow  ' key={step}>
      <div className='absolute bottom-full left-1/2 transform -translate-x-1/2 -translate-y-1/2'>
        <div
          className={cn(
            'flex whitespace-nowrap text-[#898989] text-[10px] xs:text-[14px] md:text-[18px] -tracking-[0.03em] font-bold',
            {
              'text-secondary': active > step,
              'text-foreground': active === step,
              'text-[#898989]': active < step,
            },
          )}
        >
          {step}.
          <span
            className={cn('hidden md:inline-block ml-2', {
              'inline-block': active === step,
            })}
          >
            {name}
          </span>
        </div>
      </div>
      <div className='absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2'>
        <div
          className={cn('w-[6px] h-[6px] bg-[#898989] rounded-full', {
            'bg-secondary': active > step,
            'bg-foreground': active === step,
            'bg-[#898989]': active < step,
          })}
        ></div>
      </div>
      <div className='border-t bg-[#1D1B1C] bg-opacity-30 flex-grow'></div>
    </div>
  );
}
