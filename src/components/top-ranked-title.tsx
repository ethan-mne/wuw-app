import { cn } from '@/lib/utils';

export function TopRankedTitle({
  className,
  textStyle,
  text,
}: {
  className?: string;
  textStyle?: string;
  text: string;
}) {
  return (
    <div
      className={cn(
        'flex h-[327px] w-full items-center justify-center bg-foreground border-none',
        className,
      )}
    >
      <h1
        className={cn(
          'text-[16px] text-center font-medium uppercase tracking-[0.45em] text-white md:text-[24px]',
          textStyle,
        )}
      >
        {text}
      </h1>
    </div>
  );
}
