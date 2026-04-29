import { cn } from '@/lib/utils';
import { Button, buttonVariants, type ButtonProps } from './ui/button';
import { HoverWacth, Right } from './icons';
import { Link as NextLink } from '@/navigation';
import type { pathnames } from '@/config';
import { Watch } from '@/components/icons';

export interface AnimatedButtonProps extends ButtonProps {
  text: string;
  textStyle?: string;
  iconStyle?: string;
  loading?: boolean;
}
export function SwipeAnimatedButton({
  text,
  textStyle,
  className,
  iconStyle,
  loading,
  ...props
}: Readonly<AnimatedButtonProps>) {
  return (
    <Button
      variant='outline'
      className={cn(
        'w-[300px] xs:w-[334px] h-[58px]  inline-flex border-none rounded-[5px] bg-primary text-background hover:bg-primary  	hover:text-background  p-0   ',
        className,
      )}
      disabled={loading}
      {...props}
    >
      <div className='flex h-full w-full items-center justify-center gap-[16px] rounded-[5px] '>
        <span
          className={cn(
            'text-[20px] -tracking-[0.03em] font-bold pl-4',
            textStyle,
          )}
        >
          {loading ? 'Processing...' : text}
        </span>
        <Right className={cn('mt-1 h-[27px] w-[27px]', iconStyle)} />
      </div>
    </Button>
  );
}

export function ScaleAnimatedLink({
  href,
  text,
  className,
  containerStyle,
}: {
  href: keyof typeof pathnames;
  text: string;
  className?: string;
  containerStyle?: string;
}) {
  return (
    <NextLink
      target='_blank'
      rel='noreferrer'
      href={href}
      className={cn(
        'group transition-all ease-[cubic-bezier(0.38, 0.01, 0.38, 1)] duration-200 ',
        containerStyle,
      )}
    >
      <div
        className={cn(
          buttonVariants({ variant: 'outline' }),
          'group  inline-flex border-none rounded-[5px] bg-foreground text-background hover:bg-foreground  shadow-[4px_-3.81px_28.55px_rgba(0,0,0,0.1)]	hover:text-background w-[300px] xs:w-[334px] h-[58px] group-hover:bg-gradient-to-b group-hover:from-transparent group-hover:via-white/15 p-0 ',
          className,
        )}
      >
        <span className='text-[20px] -tracking-[0.03em] font-bold group-hover:text-[16.55px]'>
          {text}
        </span>
      </div>
    </NextLink>
  );
}

export function JoinNextCompetitionButton({
  href,
  text,
  className,
  containerStyle,
}: {
  href: keyof typeof pathnames;
  text: string;
  className?: string;
  containerStyle?: string;
}) {
  return (
    <div
      className={cn(
        'group transition  duration-200 ease-[cubic-bezier(0.38, 0.01, 0.38, 1)] rounded-[5px]',
        containerStyle,
      )}
    >
      <NextLink
        target='_blank'
        rel='noreferrer'
        href={href}
        className={cn(
          buttonVariants({ variant: 'outline' }),
          'w-[300px] xs:w-[334px] h-[58px]  inline-flex border-none rounded-[5px] bg-primary text-background hover:bg-primary  shadow-[4px_-3.81px_28.55px_rgba(0,0,0,0.1)]	hover:text-background  p-0   group-hover:hidden',
          className,
        )}
      >
        <div className='flex h-full w-full items-center justify-center gap-[16px] rounded-[5px] '>
          <span className='text-[20px] -tracking-[0.03em] font-bold '>
            {text}
          </span>
          <Watch className='mt-0.5 h-[27px] w-[27px] fill-primary text-white ' />
        </div>
      </NextLink>
      <NextLink
        target='_blank'
        rel='noreferrer'
        href={href}
        className={cn(
          buttonVariants({ variant: 'outline' }),
          ' w-[300px] xs:w-[334px] h-[58px]   border-none rounded-[5px] bg-primary text-background hover:bg-primary  shadow-[4px_-3.81px_28.55px_rgba(0,0,0,0.1)]	hover:text-background  p-0 hidden group-hover:inline-flex',
          className,
        )}
      >
        <div className='flex flex-row h-full w-full items-center justify-center gap-[17px]  bg-white/30 rounded-[5px] '>
          <span className='text-[18.78px] -tracking-[0.03em] font-bold '>
            {text}
          </span>
          <HoverWacth className='mt-0.5 h-[27px] w-[27px]  ' />
        </div>
      </NextLink>
    </div>
  );
}

export function ScaleAnimatedButton({
  text,
  className,
  ...props
}: AnimatedButtonProps) {
  {
    return (
      <Button
        className={cn(
          'group transition-all ease-[cubic-bezier(0.38, 0.01, 0.38, 1)] duration-200 delay-200   inline-flex border-none rounded-[5px] bg-foreground text-background hover:bg-foreground  shadow-[4px_-3.81px_28.55px_rgba(0,0,0,0.1)]	hover:text-background w-[300px] xs:w-[334px] h-[58px]  p-0 ',
          className,
        )}
        {...props}
      >
        <div
          className={cn(
            'w-full h-full flex justify-center items-center group-hover:bg-gradient-to-b group-hover:from-transparent group-hover:via-white/15 p-0 ',
          )}
        >
          <span className='text-[20px] -tracking-[0.03em] font-bold group-hover:text-[16.55px]'>
            {text}
          </span>
        </div>
      </Button>
    );
  }
}
