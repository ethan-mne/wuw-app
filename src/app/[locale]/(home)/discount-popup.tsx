'use client';

import { Mail, Winuwatch } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { VideoBackground } from '@/components/video-bg';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { signIn } from 'next-auth/react';
import { toast } from 'sonner';
import { sendNewsLetterReductionCode } from '@/lib/sendNewsLetterReductionCode';

const discountPopUpSchema = z.object({
  email: z.string().email(),
});

export type discountPopUpType = z.infer<typeof discountPopUpSchema>;

export function DiscountPopUp() {
  const [open, setOpen] = useState(false);
  const showTime = 2000; // 30 seconds in milliseconds
  const isDesktop = useMediaQuery('(min-width: 768px)');
  const Tcompetition = useTranslations('competition');

  useEffect(() => {
    if (isDesktop) return;
    const timer = setTimeout(() => {
      setOpen(true);
    }, showTime);

    return () => clearTimeout(timer);
  }, [isDesktop]);

  const form = useForm<discountPopUpType>({
    resolver: zodResolver(discountPopUpSchema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = async (values: discountPopUpType) => {
    console.log(values);
    toast.loading('Sending email...');
    const { data, checkEmail } = await sendNewsLetterReductionCode({
      identifier: values.email,
    });
    if (!checkEmail) {
      await signIn('email', {
        email: values.email,
        redirect: false,
      });
      toast.success('Email sent successfully, please verify mailbox');
    } else {
      toast.error(data.error?.message);
    }
  };

  const Thome = useTranslations('home');
  const TAbout = useTranslations('about_us');

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className='w-full max-w-[390px] h-[565px] p-0 border-none shadow-none '>
        <div className='flex h-full w-full flex-col justify-start  py-5 '>
          <VideoBackground />
          <DialogHeader>
            <Winuwatch className='w-[192.67px] h-[24.41] fill-background mx-auto mt-6 z-20' />
          </DialogHeader>

          <div className=' w-full h-full flex flex-col items-center justify-around  z-20 px-6'>
            <h1 className='text-[64px] -tracking-[0.04em] font-medium text-background text-center'>
              25% {Tcompetition('off')}
            </h1>
            <h2 className='uppercase text-secondary text-[20px] -tracking-[0.06em] font-medium text-center'>
              {Thome('for_your_first_competition')}
            </h2>
            <p className='text-background text-[16px] -tracking-[0.03em] font-bold text-center px-6'>
              {TAbout('register_for_our_newsletter')}
            </p>
            <p className='text-background text-[12px] -tracking-[0.03em] font-normal text-center leading-[19px]  px-10'>
              {Thome('discount_code_will_be_sent')}
            </p>

            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className='flex flex-col gap-[9px] z-20 w-full'
              >
                <FormField
                  control={form.control}
                  name='email'
                  render={({ field }) => (
                    <FormItem className=''>
                      <FormControl className=''>
                        <Input
                          {...field}
                          placeholder='Enter your email address...'
                          icon={<Mail className='h-5 w-5 fill-primary' />}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <Button
                  type='submit'
                  className='bg-primary hover:bg-primary h-[58px] rounded-[5px] px-5'
                >
                  {Thome('get_early_access')}
                </Button>
              </form>
            </Form>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
