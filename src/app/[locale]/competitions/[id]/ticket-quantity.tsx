import { Button } from '@/components/ui/button';
import { useCart } from '@/store/use-cart';
import { useCheckoutSteps } from '@/store/use-checkout-steps';
import { useTranslations } from 'next-intl';

const MAX_TICKETS = 50;

export function TicketQuantity({
  remaining_tickets,
  disabled = false,
}: {
  remaining_tickets: number;
  disabled?: boolean;
}) {
  const { paymentStep } = useCheckoutSteps();
  const { tickets, decTickets, incTickets } = useCart();

  const Tcompetition = useTranslations('competition');

  return disabled ? (
    <div className='flex items-center gap-2'>
      <p className='uppercase text-[16px] text-[#898989] -tracking-[0.06em]'>
        {remaining_tickets} {Tcompetition('tickets')}
      </p>
    </div>
  ) : (
    <div className='flex items-center gap-2'>
      <p className='uppercase text-[16px] text-[#898989] -tracking-[0.06em]'>
        {tickets} {Tcompetition('tickets')}
      </p>
      <div
        className={`flex items-center justify-center ${paymentStep ? 'hidden' : ''}`}
      >
        <Button
          disabled={tickets <= 1}
          type='button'
          onClick={() => {
            decTickets(1);
          }}
          className='w-[22px] h-[22px] p-0 bg-[#F5F5F5] hover:bg-[#F5F5F5]  rounded-tl-full rounded-bl-full flex justify-center items-baseline  border border-r-0 border-[#1D1B1C] border-opacity-10 '
        >
          <span className='text-[#898989] font-bold'>-</span>
        </Button>
        <Button
          type='button'
          onClick={() => {
            incTickets(1);
          }}
          disabled={
            tickets >= remaining_tickets || tickets >= MAX_TICKETS || disabled
          }
          className='w-[22px] h-[22px] p-0 bg-[#F5F5F5]  hover:bg-[#F5F5F5] rounded-tr-full rounded-br-full flex justify-center items-baseline border border-l-0.5 border-[#1D1B1C] border-opacity-10'
        >
          <span className='text-[#898989] font-bold'>+</span>
        </Button>
      </div>
    </div>
  );
}
