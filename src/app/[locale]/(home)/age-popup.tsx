'use client';

import { Winuwatch } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';
import { useState } from 'react';
import { useTranslations } from 'next-intl';

function getInitialState() {
  if (typeof window === 'undefined') return false;
  return localStorage?.getItem('age-condition') !== 'true';
}

export function AgePopUp() {
  const t = useTranslations('popup');
  const [selectedValue, setSelectedValue] = useState('');
  const [showRest, setShowRest] = useState(false);
  const [open, setOpen] = useState(getInitialState);

  // If we're on the server, don't render anything
  if (typeof window === 'undefined') return null;

  return (
    <Dialog open={open}>
      <DialogContent
        showClose={false}
        className='w-full max-w-[390px] p-0 border-none shadow-none bg-black'
      >
        <div className='flex h-full w-full flex-col justify-start pt-5'>
          <DialogHeader className='w-fit space-y-2 mx-auto pb-3'>
            <span className='bg-white flex flex-col w-fit mx-auto p-2 z-20'>
              <Winuwatch className='w-[192.67px] h-[24.41] z-20 text-black' />
            </span>
            <p className='uppercase tracking-[5px] font-normal text-xs text-white/50'>
              # luxury watch contest
            </p>
          </DialogHeader>

          {!showRest ? (
            <div className='bg-white flex h-full flex-col items-center gap-5 w-full p-3 text-center -tracking-[0.03em] mx-auto'>
              <p className='font-bold text-2xl max-w-[80%]'>{t(`welcome`)}</p>
              <p className='text-black/50 text-xs max-w-[80%]'>
                {t(`please_confirm`)}
              </p>
              <div className='mx-auto w-fit space-y-3 max-w-[80%]'>
                {[
                  {
                    title: 'Yes, I am 18 years of age or older',
                    option: '1',
                  },
                  {
                    title: 'No, I am under 18 years of age',
                    option: '2',
                  },
                ].map((item, index) => (
                  <div key={index} className='flex gap-2 items-center'>
                    <input
                      type='checkbox'
                      checked={selectedValue === item.option}
                      onChange={() =>
                        setSelectedValue(
                          selectedValue === item.option ? '' : item.option,
                        )
                      }
                      className='size-4 accent-secondary rounded-md p-2'
                    />
                    <p
                      className={cn('text-black/50 text-[13px]', {
                        '!text-black': selectedValue === item.option,
                      })}
                    >
                      {item.title}
                    </p>
                  </div>
                ))}
              </div>
              <Button
                onClick={() => {
                  if (selectedValue === '1') {
                    setOpen(false);
                    localStorage?.setItem('age-condition', 'true');
                  } else {
                    setShowRest(true);
                  }
                }}
                type='button'
                className='bg-black my-3 w-full'
              >
                {t(`confirm`)}
              </Button>

              <p className='text-black/50 text-xs'>{t(`by_clicking`)}</p>
            </div>
          ) : (
            <div className='bg-white flex h-full flex-col items-center gap-3 w-full p-3 text-center -tracking-[0.03em] mx-auto'>
              <div className='bg-red-600 mx-auto p-4 rounded-full mt-5'>
                <X className='text-white' />
              </div>
              <p className='font-bold text-xl max-w-[80%]'>{t(`oops`)}</p>
              <p className='text-black/50 text-xs max-w-[80%]'>
                {t(`we_are_sorry`)}
              </p>
              <p className='text-black/50 text-xs max-w-[80%]'>
                {t(`we_encourage`)}
              </p>
              <p className='font-bold text-lg max-w-[80%]'>{t(`thank_you`)}</p>
              <p className='text-black/50 text-xs max-w-[80%] mb-4'>
                WINUWATCH Family
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
