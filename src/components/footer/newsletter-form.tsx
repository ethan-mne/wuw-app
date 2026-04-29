'use client';

import { useForm } from 'react-hook-form';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '../ui/form';
import { Input } from '../ui/input';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '../ui/button';
import { Mail } from '../icons';
import { useTranslations } from 'next-intl';

const newsletterSchema = z.object({
  email: z.string().email(),
});
type NewsletterType = z.infer<typeof newsletterSchema>;

export function NewsletterForm() {
  const form = useForm({
    resolver: zodResolver(newsletterSchema),
    defaultValues: {
      email: '',
    },
  });
  const onSubmit = async (values: NewsletterType) => {
    console.log(values);
  };
  const Thome = useTranslations('home');
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-3'>
        <FormField
          control={form.control}
          name='email'
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input
                  icon={<Mail className='h-5 w-5 fill-primary' />}
                  placeholder='Enter your email address...'
                  {...field}
                  className='bg-[#F5F5F5] text-sm font-light text-zinc-700 placeholder:text-zinc-600 focus-visible:ring-0 focus-visible:ring-offset-0 '
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button
          className='w-full bg-foreground text-[14px] font-medium -tracking-normal hover:bg-foreground'
          type='submit'
          disabled={form.formState.isSubmitting}
        >
          {Thome('get_early_accesss')}
        </Button>
      </form>
    </Form>
  );
}
