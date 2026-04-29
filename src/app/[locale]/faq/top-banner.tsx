import { useTranslations } from 'next-intl';

export function TopBnner() {
  const Tcheckout = useTranslations('checkout');
  const Tfaq = useTranslations('faq');

  return (
    <div className='w-full bg-foreground  h-[157px] md:h-[99px] flex flex-col  justify-center items-center uppercase gap-2'>
      <p className='uppercase text-[16px] font-normal text-[#DBE5E0] md:hidden'>
        {Tcheckout('faq')}
      </p>
      <p className='text-[24px] md:text-[36px] font-bold text-background text-center'>
        {Tfaq('you_have_questions')}{' '}
        <span className='text-secondary'>{Tfaq('we_have_answers')}</span>
      </p>
    </div>
  );
}
