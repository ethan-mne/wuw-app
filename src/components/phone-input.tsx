import { CheckIcon } from 'lucide-react';
import * as RPNInput from 'react-phone-number-input';
import flags from 'react-phone-number-input/flags';
import * as RPNInputSimple from 'react-phone-number-input/input';
import { Button } from './ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from './ui/command';
import { Input, type InputProps } from './ui/input';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';

import { cn } from '@/lib/utils';
import { forwardRef } from 'react';
import { Down } from './icons';
import * as React from 'react';
import type { E164Number } from 'libphonenumber-js';

export type PhoneInputValue = RPNInput.Value;

type PhoneInputSimpleProps = React.ComponentProps<
  typeof RPNInputSimple.default
>;

const PhoneInputSimple = ({ ...props }: PhoneInputSimpleProps) => (
  <RPNInputSimple.default placeholder='' inputComponent={Input} {...props} />
);
PhoneInputSimple.displayName = 'PhoneInputSimple';

// type PhoneInputProps = React.ComponentProps<typeof RPNInput.default>;
type PhoneInputProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  'onChange' | 'value'
> &
  Omit<RPNInput.Props<typeof RPNInput.default>, 'onChange' | 'value'> & {
    onChange?: (value: string | E164Number) => void;
    value?: string | E164Number;
    icon?: React.ReactNode;
  };

const PhoneInput: React.ForwardRefExoticComponent<PhoneInputProps> =
  React.forwardRef<React.ElementRef<typeof RPNInput.default>, PhoneInputProps>(
    ({ className, onChange, value, ...props }, ref) => {
      return (
        <RPNInput.default
          ref={ref}
          className={cn('flex', className)}
          flagComponent={FlagComponent}
          defaultCountry='FR'
          countrySelectComponent={CountrySelect}
          inputComponent={InputComponent}
          value={value as E164Number}
          onChange={(value) => {
            return onChange?.(value ?? '');
          }}
          countryCallingCodeEditable={false}
          addInternationalOption={false}
          international={false}
          limitMaxLength={true}
          initialValueFormat='national'
          {...props}
        />
      );
    },
  );

PhoneInput.displayName = 'PhoneInput';

const InputComponent = forwardRef<HTMLInputElement, InputProps>(
  ({ className, ...props }, ref) => (
    <div className='w-full rounded-[5px]'>
      <Input
        className={cn(
          'w-full rounded-bl-none rounded-tl-none border-b border-l-0 border-r  border-t',
          className,
        )}
        {...props}
        ref={ref}
      />
    </div>
  ),
);

InputComponent.displayName = 'InputComponent';

type CountrySelectOption = { label: string; value: RPNInput.Country };

type CountrySelectProps = {
  disabled?: boolean;
  value: RPNInput.Country;
  onChange: (value: RPNInput.Country) => void;
  options: CountrySelectOption[];
};

const CountrySelect = ({
  disabled,
  value = 'FR',
  onChange,
  options,
}: CountrySelectProps) => {
  const handleSelect = React.useCallback(
    (country: RPNInput.Country) => {
      onChange(country);
    },
    [onChange],
  );

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type='button'
          variant={'outline'}
          className={cn(
            ' flex h-12 gap-1 rounded-br-none rounded-tr-none border-b border-l border-r-0 border-t pl-3 pr-1  hover:bg-white',
          )}
          disabled={disabled}
        >
          <span className='flex items-center truncate'>
            <div className='flex h-4 w-6 rounded-sm bg-foreground/20'>
              {value && <FlagComponent country={value} countryName={value} />}
            </div>
          </span>
          <Down className={`h-2 w-4 ${disabled ? 'hidden' : ''}`} />
        </Button>
      </PopoverTrigger>
      <PopoverContent className='w-[300px] p-0'>
        <Command>
          <CommandList>
            <CommandInput placeholder='Search country...' />
            <CommandEmpty>No country found.</CommandEmpty>
            <CommandGroup>
              {options
                .filter((x) => x.value)
                .map((option) => {
                  // console.log(RPNInput.getCountryCallingCode(option.value));
                  return (
                    <CommandItem
                      className={'gap-2 text-sm'}
                      key={option.value}
                      onSelect={() => handleSelect(option.value)}
                    >
                      <FlagComponent
                        country={option.value}
                        countryName={option.label}
                      />
                      <span>{option.label}</span>
                      <span className='text-foreground/50'>
                        {`+${RPNInput.getCountryCallingCode(option.value)}`}
                      </span>
                      <CheckIcon
                        className={`ml-auto h-4 w-4 ${
                          option.value === value ? 'opacity-100' : 'opacity-0'
                        }`}
                      />
                    </CommandItem>
                  );
                })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

const FlagComponent = ({ country, countryName }: RPNInput.FlagProps) => {
  const Flag = flags[country];

  return (
    <span
      className={'inline h-4 w-6 overflow-hidden rounded-sm object-contain'}
    >
      {Flag && <Flag title={countryName} />}
    </span>
  );
};

export { PhoneInput, PhoneInputSimple };
