'use client';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { zodResolver } from '@hookform/resolvers/zod';
import React from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import sendEmailAction from './sendEmailAction';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

const FormSchema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  email: z.string().email(),
  phone: z.string().min(1, 'Phone number is required'),
  message: z.string().min(1, 'Message is required'),
});

type FormSchemaType = z.infer<typeof FormSchema>;

const ContactForm = () => {
  const form = useForm<FormSchemaType>({
    resolver: zodResolver(FormSchema),
  });

  const formSubmit = (data: FormSchemaType) => {
    toast.promise(
      sendEmailAction({
        clientInfo: {
          clientFirstName: data.first_name,
          clientLastName: data.last_name,
          clientEmail: data.email,
          clientPhone: data.phone,
          clientMessage: data.message,
        },
      }),
      {
        loading: 'Sending message...',
        success: 'Message sent successfully',
        error: 'Failed to send message',
      },
    );
    form.reset();
  };
  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(formSubmit)}
        className='flex-1 p-3 w-full flex flex-col gap-9 min-w-[280px]'
      >
        <div className='flex flex-wrap items-center justify-between gap-9 w-full'>
          <FormField
            control={form.control}
            name='first_name'
            render={({ field }) => (
              <FormItem className='w-full sm:w-fit'>
                <FormLabel>First name</FormLabel>
                <FormControl>
                  <Input
                    className='outline-none border-0 rounded-none border-b border-b-black/30 pb-2'
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='last_name'
            render={({ field }) => (
              <FormItem className='w-full sm:w-fit'>
                <FormLabel>Last name</FormLabel>
                <FormControl>
                  <Input
                    className='outline-none border-0 rounded-none border-b border-b-black/30 pb-2'
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='email'
            render={({ field }) => (
              <FormItem className='w-full sm:w-fit'>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    className='outline-none border-0 rounded-none border-b border-b-black/30 pb-2'
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='phone'
            render={({ field }) => (
              <FormItem className='w-full sm:w-fit'>
                <FormLabel>Phone</FormLabel>
                <FormControl>
                  <Input
                    className='outline-none border-0 rounded-none border-b border-b-black/30 pb-2'
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='message'
            render={({ field }) => (
              <FormItem className='w-full'>
                <FormLabel>Message</FormLabel>
                <FormControl>
                  <Textarea
                    className='outline-none focus:outline-none border-0 rounded-none border-b border-b-black/30 pb-2 w-full'
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <Button
          type='submit'
          className='self-end bg-[#114F33] text-white py-3 px-8 w-full text-center sm:w-fit sm:bg-black rounded-md mb-14 sm:mb-0'
        >
          Send Message
        </Button>
      </form>
    </Form>
  );
};

export default ContactForm;
