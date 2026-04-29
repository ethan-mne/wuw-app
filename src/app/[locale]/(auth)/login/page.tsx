import { LoginForm } from './login-form';
import { useTranslations } from 'next-intl';

import { unstable_setRequestLocale } from 'next-intl/server';

export const dynamic = 'force-dynamic';

export default function Login({
  params: { locale },
}: {
  params: { locale: string };
}) {
  unstable_setRequestLocale(locale);
  const Tauth = useTranslations('auth');
  return (
    <div className='h-full w-full flex flex-col  justify-evenly '>
      <div className='w-full flex flex-col items-center gap-[26px]'>
        <h1 className='capitalize text-foreground font-bold text-[24px] text-center -tracking-[0.05em]'>
          {Tauth('welcoming')}
        </h1>
        {/* <p className='font-medium text-[16px] text-[#7C7C7C]  text-center -tracking-[0.05em] w-4/5'>
          Please enter your email to receive your authentication code
        </p> */}
      </div>
      <LoginForm />
    </div>
  );
}
