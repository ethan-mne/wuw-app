import { VerificationForm } from './verification-form';

export const dynamic = 'force-dynamic';

export default function Verification() {
  return (
    <div className='h-full w-full flex flex-col justify-evenly '>
      <div>
        <h1 className='capitalize text-foreground font-bold text-[24px] text-center'>
          welcome
        </h1>
        <p className='font-medium text-[16px] text-[#7C7C7C]  text-center'>
          Please enter the code you receive in your mailbox
        </p>
      </div>
      <VerificationForm />
    </div>
  );
}
