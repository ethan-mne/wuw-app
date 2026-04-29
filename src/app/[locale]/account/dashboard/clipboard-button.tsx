'use client';

import { Clipboard } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

export function ClipboardButton({
  code,
  className,
}: {
  code: string;
  className: string;
}) {
  const handleCopyClick = async () => {
    try {
      await navigator.clipboard.writeText(code);
      toast.success('Copied !');
    } catch (err) {
      toast.error('Failed to copy , try again');
    }
  };
  const Tcharity = useTranslations('charity');

  return (
    <div
      className={cn(
        'w-full h-[77px] border border-background bg-gradient-to-b from-white/10 flex items-center justify-center gap-4',
        className,
      )}
    >
      <h1 className='text-background font-bold text-[16px] xs:text-[20px]'>
        {code}
      </h1>
      <Button
        variant={'ghost'}
        className='p-0 hover:bg-transparent h-auto flex justify-center items-center gap-2'
        onClick={handleCopyClick}
      >
        <Clipboard className='w-6 h-6 ' />
        <span className='text-background font-bold text-[16px] xs:text-[20px] underline underline-offset-8 decoration-secondary'>
          {Tcharity('copy_code')}
        </span>
      </Button>
    </div>
  );
}
