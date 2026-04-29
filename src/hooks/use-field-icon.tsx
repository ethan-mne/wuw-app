import { Success, Error } from '../components/icons';
import { type ControllerFieldState } from 'react-hook-form';

export const useFieldIcon = () => {
  const getIcon = (fieldState: ControllerFieldState) => {
    if (fieldState.error) {
      return <Error className='w-4 h-4' />;
    } else if (fieldState.isTouched && fieldState.isDirty) {
      return <Success className='w-4 h-4' />;
    } else {
      return null;
    }
  };
  return getIcon;
};
