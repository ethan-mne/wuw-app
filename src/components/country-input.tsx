import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { countryList } from '@/lib/countryList';

interface CountryInputProps {
  value: string;
  onChange: (value: string) => void; // Assuming you want to lift state up to manage the selected value
}

export const CountryInput: React.FC<CountryInputProps> = ({
  value,
  onChange,
}) => {
  // Function to handle when a country is selected
  const handleSelect = (selectedValue: string) => {
    onChange(selectedValue);
  };
  return (
    <Select value={value} onValueChange={handleSelect}>
      <SelectTrigger>
        <SelectValue placeholder='Select a country' />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>Select a country</SelectLabel>
          {countryList.map((country) => (
            <SelectItem key={country} value={country}>
              {country}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
};

export default CountryInput;
