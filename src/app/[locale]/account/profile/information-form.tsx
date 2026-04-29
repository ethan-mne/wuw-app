'use client';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useFieldIcon } from '@/hooks/use-field-icon';
import { PhoneInput } from '@/components/phone-input';

import { Separator } from '@/components/ui/separator';
import { api } from '@/trpc/react';
import { toast } from 'sonner';
import type { RouterOutputs } from '@/trpc/shared';
import { countryList } from '@/lib/countryList';
import { CountryInput } from '@/components/country-input';
import { useTranslations } from 'next-intl';
import { ScaleAnimatedButton } from '@/components/animated-button';

export const profileSchema = z.object({
  firstname: z.string().min(1),
  lastname: z.string().min(1),
  country: z
    .string()
    .min(4)
    .refine((val) => countryList.includes(val), {
      message: 'Country must be one of the available countries.',
    }),
  zip: z.string().min(1),
  address: z.string().min(1),
  city: z.string().min(1),
  phone: z.string().min(1),
  email: z.string().email(),
  subscribe_to_newsletter: z.boolean(),
  accept_terms: z.boolean(),
});

export type ProfileType = z.infer<typeof profileSchema>;

export function InformationForm({
  profile,
}: Readonly<{ profile: RouterOutputs['Users']['CurrentUser'] }>) {
  const {
    isSuccess: updateUserSuccess,
    isError: updateUserError,
    error: updateUserErrorData,
    mutateAsync: updateUserAsync,
  } = api.Users.UpdateUserData.useMutation();

  const form = useForm<ProfileType>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstname: profile?.firstName ?? '',
      lastname: profile?.lastName ?? '',
      country: profile?.country ?? '',
      zip: profile?.zipCode ?? '',
      address: profile?.address ?? '',
      city: profile?.city ?? '',
      phone: profile?.phone ?? '',
      email: profile?.email ?? '',
      subscribe_to_newsletter: true,
      accept_terms: true,
    },
  });

  const onSubmit = (values: ProfileType) => {
    toast.promise(updateUserAsync(values), {
      loading: 'Updating profile...',
      success: 'Profile updated successfully',
      error: 'Error updating profile',
    });
  };
  const getIcon = useFieldIcon();

  const Tcheckout = useTranslations('checkout');
  const Tprofile = useTranslations('profile');

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <div className='grid grid-col-1 md:grid-cols-2 gap-4'>
          <FormField
            control={form.control}
            name='firstname'
            render={({ field, fieldState }) => (
              <FormItem>
                <FormLabel className='text-[14px] font-medium -tracking-normal text-foreground'>
                  {Tcheckout('firstname')}
                </FormLabel>
                <FormControl className=''>
                  <Input {...field} icon={getIcon(fieldState)} />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name='lastname'
            render={({ field, fieldState }) => (
              <FormItem>
                <FormLabel className='text-[14px] font-medium -tracking-normal text-foreground'>
                  {Tcheckout('lastname')}
                </FormLabel>
                <FormControl>
                  <Input {...field} icon={getIcon(fieldState)} />
                </FormControl>
              </FormItem>
            )}
          />
        </div>
        <div className='grid grid-col-1 md:grid-cols-2 gap-4'>
          <FormField
            control={form.control}
            name='country'
            render={({ field }) => (
              <FormItem>
                <FormLabel className='text-[14px] font-medium -tracking-normal text-foreground'>
                  {Tcheckout('country')}
                </FormLabel>
                <FormControl>
                  <CountryInput
                    {...field}
                    value={field.value}
                    onChange={(newValue) => {
                      field.onChange(newValue);
                    }}
                  />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name='zip'
            render={({ field, fieldState }) => (
              <FormItem>
                <FormLabel className='text-[14px] font-medium -tracking-normal text-foreground'>
                  {Tcheckout('zip')}
                </FormLabel>
                <FormControl>
                  <Input {...field} icon={getIcon(fieldState)} />
                </FormControl>
              </FormItem>
            )}
          />
        </div>
        <div className='grid grid-col-1 md:grid-cols-2 gap-4'>
          <FormField
            control={form.control}
            name='address'
            render={({ field, fieldState }) => (
              <FormItem>
                <FormLabel className='text-[14px] font-medium -tracking-normal text-foreground'>
                  {Tcheckout('address')}
                </FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    icon={getIcon(fieldState)}
                    placeholder='house number & street name'
                    className='placeholder:text-[12px] placeholder:text-[#898989] placeholder:font-medium'
                  />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name='city'
            render={({ field, fieldState }) => (
              <FormItem>
                <FormLabel className='text-[14px] font-medium -tracking-normal text-foreground'>
                  {Tcheckout('city')}
                </FormLabel>
                <FormControl>
                  <Input {...field} icon={getIcon(fieldState)} />
                </FormControl>
              </FormItem>
            )}
          />
        </div>
        <div className='grid grid-col-1 md:grid-cols-2 gap-4'>
          <FormField
            control={form.control}
            name='phone'
            render={({ field, fieldState }) => (
              <FormItem>
                <FormLabel className='text-[14px] font-medium -tracking-normal text-foreground'>
                  {Tcheckout('phone')}
                </FormLabel>
                <FormControl>
                  <PhoneInput {...field} icon={getIcon(fieldState)} />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name='email'
            render={({ field, fieldState }) => (
              <FormItem>
                <FormLabel className='text-[14px] font-medium -tracking-normal text-foreground'>
                  {Tcheckout('email')}
                </FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    icon={getIcon(fieldState)}
                    readOnly={true}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </div>
        <Separator className='hidden md:flex mt-6 ' />
        <div className='flex justify-center md:justify-end'>
          <ScaleAnimatedButton
            text={Tprofile('update_your_information')}
            type='submit'
            className='mt-[61px] md:mt-[24px]'
          />
        </div>
      </form>
    </Form>
  );
}

export const TextProfile = () => {
  const Tcheckout = useTranslations('checkout');
  return <div>{Tcheckout('personnel_information')}</div>;
};
