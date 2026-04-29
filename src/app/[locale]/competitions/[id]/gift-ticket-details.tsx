'use client';

import { Dialog, DialogContent, DialogHeader } from '@/components/ui/dialog';
import { z } from 'zod';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useCheckoutSteps } from '@/store/use-checkout-steps';
import { useTranslations } from 'next-intl';
import { Label } from '@/components/ui/label';
import { type ChangeEvent, useState } from 'react';

interface GiftTicketDetailsProps {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

export const giftTicketSchema = z.object({
  name: z.string().min(4),
  email: z.string().email(),
  phone: z.string().min(4),
  message: z.string().min(4),
});

type ValidationErrors = Record<string, string>;

export function GiftTicketDetails({ open, setOpen }: GiftTicketDetailsProps) {
  const { updateGift } = useCheckoutSteps();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
    phone: '',
  });

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ): void => {
    const { name, value } = e.target;
    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>(
    {},
  );

  const Tcheckout = useTranslations('checkout');

  const onSave = () => {
    const result = giftTicketSchema.safeParse(formData);
    if (result.success) {
      const validatedData = result.data;
      // If validation succeeds, execute the logic
      updateGift(
        validatedData.name,
        validatedData.email,
        validatedData.message,
        validatedData.phone,
      );
      setOpen(false);
      toast.success('Gift ticket added successfully!');
    } else {
      // If validation fails, handle the error
      const errors: ValidationErrors = {};
      result.error.errors.forEach((error) => {
        const fieldName = error.path[0];
        if (fieldName !== undefined) {
          errors[fieldName] = error.message;
        }
      });
      setValidationErrors(errors);
    }
  };
  const Tcompetition = useTranslations('competition');
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className='sm:max-w-[722px] bg-black  border-none close:border-none'>
        <DialogHeader>
          <div className='flex flex-col gap-1 text-white '>
            <h1 className='text-secondary uppercase font-bold text-[24px]'>
              {Tcompetition('gift_ticket')}
              <span className='text-white'> {Tcompetition('detaills')}</span>
            </h1>
            <p className='text-[#C5C5C5] font-medium text-[14px]'>
              {Tcompetition('provide_details_person')}
            </p>
          </div>
        </DialogHeader>
        <div className=' pb-0'>
          <div className='grid  grid-cols-1 md:grid-cols-2 gap-2'>
            <div className='grid-cols-1 col-span-full md:col-span-1'>
              <Label className='text-white font-medium text-[14px]'>Name</Label>
              <Input
                placeholder='name on ticket'
                value={formData.name}
                onChange={handleChange}
                name='name'
                className={
                  validationErrors.name ? 'border border-destructive' : ''
                }
              />
            </div>
            <div className='grid-cols-1 col-span-full md:col-span-1'>
              <Label className='text-white font-medium text-[14px]'>
                {Tcheckout('email')}
              </Label>
              <Input
                placeholder='Email address'
                value={formData.email}
                onChange={handleChange}
                name='email'
                className={
                  validationErrors.email ? 'border border-destructive' : ''
                }
              />
            </div>
            <div className='grid-cols-1 col-span-full md:col-span-2'>
              <Label className='text-white font-medium text-[14px]'>
                {Tcheckout('phone')}
              </Label>
              <Input
                placeholder='Telephone number'
                value={formData.phone}
                onChange={handleChange}
                name='phone'
                className={
                  validationErrors.phone ? 'border border-destructive' : ''
                }
              />
            </div>
            <div className='grid-cols-1 col-span-full md:col-span-2'>
              <Label className='text-white font-medium text-[14px]'>
                {' '}
                Add a personal message
              </Label>
              <Textarea
                placeholder='Write your message here'
                value={formData.message}
                onChange={handleChange}
                name='message'
                className={
                  validationErrors.message
                    ? 'border border-destructive resize-none'
                    : 'resize-none'
                }
              />
            </div>
            <div className='grid-cols-1 col-span-full md:col-span-2 flex justify-end gap-3'>
              <Button
                className='bg-[#DBE5E0] hover:bg-[#DBE5E0] text-[#898989] hover:text-[#898989] h-8 rounded-lg px-5'
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type='button'
                className='bg-secondary hover:bg-secondary h-8 rounded-lg px-5'
                onClick={onSave}
              >
                Save & continue
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
