'use client';

import { Google } from '@/components/icons';
// import { OTPInput } from '@/components/otp-input';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from '@/components/ui/form';
import { cn } from '@/lib/utils';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

const verificationSchema = z.object({
  otp: z.string().min(5),
});
type VerificationType = z.infer<typeof verificationSchema>;

export function VerificationForm() {
  const form = useForm<VerificationType>({
    resolver: zodResolver(verificationSchema),
    defaultValues: {
      otp: '',
    },
  });
  const onSubmit = async (values: VerificationType) => {
    console.log(values);
  };

  const handleResend = async () => {
    console.log('resend');
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-5'>
        <FormField
          control={form.control}
          name='otp'
          render={({ field, fieldState }) => (
            <FormItem className='flex flex-col justify-center items-center'>
              <FormLabel className=''>Authentication code</FormLabel>
              <FormControl>
                {/* <OTPInput
                  {...field}
                  numInputs={5}
                  placeholder=''
                  className={cn('w-[47px] h-[47px]', {
                    '!border-secondary':
                      !fieldState.error && fieldState.isTouched,
                  })}
                  type='text'
                /> */}
              </FormControl>
            </FormItem>
          )}
        />
        <div className='flex justify-center'>
          <Button
            type='button'
            onClick={handleResend}
            className=' bg-[#D9D9D9] hover:bg-[#D9D9D9] rounded-[14px] h-[26px] text-foreground  text-[12px] font-medium'
          >
            Didn’t get the code ? resend
          </Button>
        </div>

        <div className='space-y-2'>
          <Button
            className='bg-foreground  w-full h-[64px] font-bold text-[16px] hover:bg-foreground rounded-[5px]'
            type='submit'
          >
            Confirm
          </Button>
          <p className='font-medium text-[12px] text-[#898989] text-center'>
            Or
          </p>
          <Button
            className='bg-[#F5F5F5] hover:bg-[#F5F5F5] w-full h-[64px] flex justify-center items-center gap-4 rounded-[5px] '
            type='button'
          >
            <Google className='w-[30px] h-[30px]' />
            <span className='font-bold text-[16px] text-foreground'>
              Login with Google
            </span>
          </Button>
        </div>
        <p className='text-center font-medium text-[12px] text-[#898989]'>
          By connecting or creating your account, you agree to our terms and
          conditions.
        </p>
      </form>
    </Form>
  );
}
