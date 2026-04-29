'use client';
import { Google } from '@/components/icons';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import type { FieldErrors } from 'react-hook-form';
import { z } from 'zod';
import { signIn } from 'next-auth/react';
import { toast } from 'sonner';
import { Otp } from './otp';
import { sendOTPmail, type SendOTPResult } from './actions';
import { useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { useState } from 'react';

const OTP_CODE_REGEX = /^\d{6}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const loginSchema = z
  .object({
    email: z.string().optional(),
    otpID: z.string().optional(),
    otpCode: z.string().optional(),
  })
  .superRefine((values, ctx) => {
    if (!values.otpID) {
      const email = values.email?.trim() ?? '';
      if (!email || !EMAIL_REGEX.test(email)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['email'],
          message: 'Please enter a valid email address',
        });
      }
      return;
    }

    if (!values.otpCode) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['otpCode'],
        message: 'Please enter the 6-digit code',
      });
      return;
    }

    if (!OTP_CODE_REGEX.test(values.otpCode.trim())) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['otpCode'],
        message: 'Please enter a valid 6-digit code',
      });
    }
  });
type LoginType = z.infer<typeof loginSchema>;

export function LoginForm() {
  const Tauth = useTranslations('auth');
  const searchParams = useSearchParams();
  const [isResending, setIsResending] = useState(false);
  const form = useForm<LoginType>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      // otpID: 'clw5hy9940001sp0m8ubbjsh2',
      // otpCode: '465072',
    },
  });

  const getOTPErrorMessage = (
    errorResult: Extract<SendOTPResult, { status: 'error' }>,
  ) => {
    if (errorResult.code === 'invalid_email') {
      return Tauth('otp.invalid_email');
    }

    if (errorResult.code === 'rate_limited') {
      return Tauth('otp.rate_limited', {
        seconds: errorResult.retryAfterSeconds ?? 60,
      });
    }

    return Tauth('otp.error');
  };

  const mapPromiseError = (error: unknown) =>
    error instanceof Error ? error.message : Tauth('otp.error');

  const requestOTP = async (email: string) => {
    const result = await sendOTPmail(email.trim());
    if (result.status === 'sent') {
      form.setValue('otpID', result.otpID, {
        shouldDirty: true,
        shouldValidate: true,
      });
      return result;
    }

    throw new Error(getOTPErrorMessage(result));
  };

  const onSubmit = async (values: LoginType) => {
    if (!values.otpID) {
      const request = requestOTP(values.email?.trim() ?? '');
      toast.promise(request, {
        loading: Tauth('otp.loading'),
        success: Tauth('otp.success'),
        error: mapPromiseError,
      });
      await request;
      return;
    }

    const signInRequest = signIn('otp', {
      otpID: values.otpID,
      otp: values.otpCode?.trim(),
      redirect: false,
      callbackUrl: '/account/dashboard',
    }).then((result) => {
      if (!result?.ok || result.error) {
        throw new Error(Tauth('sign_in.error'));
      }
      return result;
    });

    toast.promise(signInRequest, {
      loading: Tauth('sign_in.loading'),
      success: Tauth('sign_in.success'),
      error: mapPromiseError,
    });

    const signInResult = await signInRequest;
    window.location.assign(signInResult.url ?? '/account/dashboard');
  };

  const onInvalidSubmit = (errors: FieldErrors<LoginType>) => {
    const issueMessage =
      errors.otpCode?.message ??
      errors.email?.message ??
      Tauth('sign_in.error');

    toast.error(String(issueMessage));
  };

  const isOAuthAccountNotLinked =
    searchParams.get('error') === 'OAuthAccountNotLinked';

  return (
    <Form {...form}>
      {isOAuthAccountNotLinked && (
        <p className='text-red-500 text-[12px]'>{Tauth('email_used')}</p>
      )}
      <form
        onSubmit={form.handleSubmit(onSubmit, onInvalidSubmit)}
        className='space-y-5 mt-[41px] px-5'
      >
        {form.watch('otpID') ? (
          <FormField
            control={form.control}
            name='otpCode'
            render={({ field }) => (
              <FormItem className='flex flex-col items-center gap-4 w-full'>
                <FormLabel>{Tauth('form.otpCode.label')}</FormLabel>
                <FormDescription className='text-[12px] text-[#898989] font-medium text-center -tracking-normal'>
                  {Tauth('form.otpCode.description')}
                </FormDescription>
                <FormControl className='flex justify-center'>
                  <Otp
                    className='w-full'
                    value={field.value ?? ''}
                    onChange={(value) => {
                      field.onChange(value.replace(/\D/g, ''));
                    }}
                    onBlur={field.onBlur}
                  />
                </FormControl>
                <FormMessage />
                <div className='flex justify-center'>
                  <Button
                    type='button'
                    onClick={async () => {
                      setIsResending(true);
                      try {
                        const request = requestOTP(
                          form.getValues('email') ?? '',
                        );
                        toast.promise(request, {
                          loading: Tauth('otp.loading'),
                          success: Tauth('otp.success'),
                          error: mapPromiseError,
                        });
                        await request;
                      } finally {
                        setIsResending(false);
                      }
                    }}
                    disabled={isResending || form.formState.isSubmitting}
                    className=' bg-[#D9D9D9] hover:bg-[#D9D9D9] rounded-[14px] h-[26px] text-foreground  text-[12px] font-medium'
                  >
                    {Tauth('form.otpCode.resend')}
                  </Button>
                </div>
              </FormItem>
            )}
          />
        ) : (
          <FormField
            control={form.control}
            name='email'
            render={({ field }) => (
              <FormItem>
                <FormLabel>{Tauth('form.email.label')}</FormLabel>
                <FormControl className=''>
                  <Input {...field} value={field.value ?? ''} />
                </FormControl>
                <FormDescription className='text-[12px] text-[#898989] font-medium text-center -tracking-normal'>
                  {Tauth('form.email.description')}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
        <div className='space-y-2'>
          <Button
            className='bg-foreground  w-full h-[64px] font-bold text-[16px] hover:bg-foreground rounded-[5px]'
            type='submit'
            disabled={form.formState.isSubmitting || isResending}
          >
            {form.formState.isSubmitting
              ? Tauth('form.submit.loading')
              : Tauth('form.submit.submit')}
          </Button>
          <p className='font-medium text-[12px] text-[#898989] text-center'>
            {Tauth('form.submit.or')}
          </p>
          <Button
            className='bg-[#F5F5F5] hover:bg-[#F5F5F5] w-full h-[64px] flex justify-center items-center gap-4 rounded-[5px] '
            type='button'
            onClick={() =>
              signIn('google', {
                callbackUrl: '/account/dashboard',
              })
            }
          >
            <Google className='w-[30px] h-[30px]' />
            <span className='font-bold text-[16px] text-foreground'>
              {Tauth('form.submit.with_gmail')}
            </span>
          </Button>
        </div>
        <p className='mx-auto font-medium text-[12px] text-[#898989] -tracking-normal w-4/5 text-center'>
          {Tauth('form.terms')}
        </p>
      </form>
    </Form>
  );
}
