import { Stepper } from './stepper';
import { SectionTitle } from '@/components/section-title';
import { JoinNextCompetitionButton } from '@/components/animated-button';
import { useTranslations } from 'next-intl';

export function HowToCompete() {
  const Thome = useTranslations('home');
  const ThowToPlay = useTranslations('howToPlay');
  return (
    <div className='flex flex-col gap-[104px] mt-[129px] '>
      <div className='w-full md:w-4/5 lg:self-center pl-4 md:pl-0'>
        <SectionTitle subtitle={ThowToPlay('get_chance_to_win')}>
          <p className='text-primary -tracking-[0.05em]'>{Thome('how_to')}</p>
          <p className='text-foreground -tracking-[0.05em]'>
            {Thome('enter_the_competition')} {Thome('competition')}
          </p>
        </SectionTitle>
      </div>

      <div className='flex w-full justify-center '>
        <Stepper />
      </div>
      <JoinNextCompetitionButton
        href='/competitions'
        text={Thome('join_the_next_competition')}
        containerStyle='self-center'
      />
    </div>
  );
}
