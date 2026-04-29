'use client';
import { OTPInput } from 'input-otp';
import { type HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

function Slot({
  char,
  isActive,
  className,
  ...props
}: HTMLAttributes<HTMLDivElement> & {
  char: string | null;
  isActive: boolean;
}) {
  return (
    <div
      className={cn(
        'relative w-10 h-14 text-[2rem]',
        'flex items-center justify-center',
        'transition-all duration-300',
        'border-border border-y border-r first:border-l first:rounded-l-md last:rounded-r-md',
        'group-hover:border-accent-foreground/20 group-focus-within:border-accent-foreground/20',
        'outline outline-0 outline-accent-foreground/20',
        { 'outline-4 outline-accent-foreground z-10': isActive },
        className,
      )}
      {...props}
    >
      {char !== null && <div>{char}</div>}
      {char === null && isActive && (
        <div className='absolute pointer-events-none inset-0 flex items-center justify-center animate-caret-blink'>
          <div className='w-px h-8 bg-white' />
        </div>
      )}
    </div>
  );
}

export const Otp = ({
  className,
  value,
  onChange,
  onBlur,
  maxLength = 6,
}: {
  className?: string;
  value?: string;
  maxLength?: number;
  onChange: (value: string) => void;
  onBlur?: () => void;
}) => (
  <OTPInput
    value={value}
    maxLength={maxLength}
    containerClassName={cn(
      'group flex items-center has-[:disabled]:opacity-30',
      className,
    )}
    onChange={onChange}
    onBlur={onBlur}
    render={({ slots }) => (
      <>
        <div className='flex'>
          {slots.slice(0, 3).map((slot, idx) => (
            <Slot key={idx} {...slot} />
          ))}
        </div>
        {/* Dash */}
        <div className='flex w-10 justify-center items-center'>
          <div className='w-3 h-1 rounded-full bg-border' />
        </div>
        <div className='flex'>
          {slots.slice(3).map((slot, idx) => (
            <Slot key={idx} {...slot} />
          ))}
        </div>
      </>
    )}
  />
);
