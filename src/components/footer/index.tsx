import Link from 'next/link';
import { cn } from '@/lib/utils';
import { buttonVariants } from '../ui/button';
import { ArrowRightIcon } from 'lucide-react';
import { Separator } from '../ui/separator';
import { InstagramMobile } from './instagram-mobile';
import { useTranslations } from 'next-intl';
import { NewsletterForm } from './newsletter-form';
import { Link as NextLink } from '@/navigation';
import {
  Copyright,
  Whatsapp,
  Trustpilot,
  LogoFooter,
  PhoneFooter,
  Instagradient,
  MailFooter,
} from '../icons';
import {
  VisaLogo,
  MastercardLogo,
  AmericanExpressLogo,
  ApplePayLogo,
} from '@/components/payment-logos';

const APP_VERSION = process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA?.slice(0, 7);

export const PaymentIcons = ({
  className,
  width = 36,
  height = 30,
}: {
  className?: string;
  width?: number;
  height?: number;
}) => (
  <div className={`flex gap-1 ${className}`}>
    <VisaLogo width={width} height={height} />
    <MastercardLogo width={width} height={height} />
    <AmericanExpressLogo width={width} height={height} />
    <ApplePayLogo width={width} height={height} />
  </div>
);

export function Footer({
  instagramCount,
}: Readonly<{
  instagramCount: string;
}>) {
  const t = useTranslations('navitems');
  const Tcheckout = useTranslations('checkout');
  const Tcomp = useTranslations('competition');
  const Thome = useTranslations('home');

  return (
    <footer className='relative w-full'>
      {/* top banner */}
      <div className='bg-zinc-800 px-4 py-12 md:py-6 '>
        <div className='flex flex-col  items-center justify-center gap-8 md:container md:max-w-screen-2xl md:flex-row   '>
          <div className='flex flex-col items-center gap-8 text-center font-helve text-white md:flex-row  '>
            <p className='text-[20px] font-bold -tracking-normal text-background xs:w-4/6 md:w-auto'>
              {Tcomp('share_experience_on')}
            </p>
            <Trustpilot className='mb-1 h-7' />
            <p className='text-[16px] md:text-[20px] font-bold -tracking-normal text-background'>
              {Tcomp('hungry_for_feedbacks')}
            </p>
          </div>
          <Link
            target='_blank'
            rel='noreferrer'
            href='https://fr.trustpilot.com/review/winuwatch.uk'
            className={cn(
              buttonVariants({ variant: 'outline' }),
              'group inline-flex transform items-center justify-start gap-2 border-none bg-emerald-700 transition-all duration-500 ease-in-out hover:bg-emerald-700 ',
            )}
          >
            <p className='text-center text-xs text-white  group-hover:order-2'>
              {Tcomp('give_feedback_now')}
            </p>
            <ArrowRightIcon
              className='mt-1 h-4 w-4 font-bold  group-hover:order-1  '
              size={10}
              color='white'
            />
          </Link>
        </div>
      </div>
      <div className='md:container md:max-w-screen-2xl'>
        <Separator className='mt-8 hidden bg-black  md:block' />
        <Separator className='mb-8 mt-0.5 hidden h-0.5 bg-black  md:block' />
        {/* instagram mobile bottom banner */}
        <InstagramMobile instagramCount={instagramCount} />
        {/* main section */}
        <div className='my-14 flex w-full flex-col gap-8 px-4 md:grid md:grid-flow-dense md:grid-cols-3 lg:gap-x-20'>
          <div className='flex  h-full w-full flex-col  justify-between gap-6 md:col-span-2'>
            {/* big logo */}
            <Link href='/' className='space-y-2 mt-1'>
              <LogoFooter className='w-full h-[68px] md:h-[155px] object-cover object-center ' />
              <div className='flex w-full justify-between text-center font-extralight text-[16px] md:text-[35.98px] font-robot'>
                {'# LUXURY WATCH CONTEST'.split('').map((char, index) => (
                  <span key={index}>{char}</span>
                ))}
              </div>
            </Link>
            {/* navigation links */}
            <div className='flex w-full flex-col  gap-[38px] md:gap-0  md:order-first md:flex-row md:justify-between  text-[30px] font-bold -tracking-[0.03em] md:text-[18px]  mt-[60px] md:mt-0'>
              <NextLink
                href='/howtoplay'
                className='font-helve  text-foreground'
              >
                {t('howto')}
              </NextLink>
              <NextLink href='/winners' className='font-helve text-foreground'>
                {t('winners')}
              </NextLink>
              {/* <NextLink
                href='/engagement'
                className='font-helve text-foreground'
              >
                {t('engage')}
              </NextLink> */}
              <NextLink href='/feed' className='font-helve text-foreground '>
                {t('feed')}
              </NextLink>
              <NextLink href='/faq' className='font-helve text-foreground'>
                {t('faq')}
              </NextLink>
              <NextLink
                href='/about-us'
                className='font-helve text-foreground '
              >
                {t('about')}
              </NextLink>
            </div>

            {/* whatsapp & visa cards */}
            <div className='grid grid-cols-2 grid-rows-2 gap-[8px] md:gap- font-helve font-semibold md:font-bold mt-[84px] md:mt-0'>
              <div className='flex h-28 flex-1 flex-col items-center justify-center gap-[17px] md:gap-[14px] rounded-[5px] md:rounded-[31.77px] bg-foreground px-2 py-6 md:h-12 md:flex-row md:border md:bg-background'>
                <div className='flex items-center justify-center gap-1 w-full md:order-last md:flex-1'>
                  <PaymentIcons className='h-8 w-auto mx-auto' />
                </div>
                <p className='text-[12px] text-white md:text-[15px] md:text-foreground font-bold -tracking-normal text-center md:flex-1'>
                  {Tcomp('secure_payment')}
                </p>
              </div>

              <Link
                href='https://wa.me/447488863429'
                target='_blank'
                rel='noreferrer'
                className='flex h-28 flex-1 flex-col items-center justify-center  rounded-[5px] md:rounded-[31.77px] bg-foreground px-2 py-6 md:h-12 md:flex-row  gap-[17px] md:gap-[14px]  md:border md:bg-background'
              >
                <Whatsapp className='h-9 fill-secondary md:order-last md:fill-foreground' />
                <p className='text-[12px] text-white  md:text-[15px] md:text-foreground font-bold -tracking-normal text-center'>
                  {Tcomp('for_any_assistance')}
                </p>
              </Link>

              <div className='flex flex-1 flex-col items-center justify-center rounded-[5px] md:rounded-[31.77px] bg-foreground px-2 py-6 md:h-12 md:flex-row h-fit gap-[10px] md:gap-[14px] md:border md:bg-background'>
                <Instagradient className='h-[25px] w-[25px] text-white sm:text-black' />
                <div className='flex flex-col md:flex-row items-center gap-2 md:gap-[14px]'>
                  <p className='text-[12px] text-white md:text-[15px] md:text-foreground font-bold -tracking-normal text-center'>
                    Contact us on Instagram
                  </p>
                  <Link
                    href='https://www.instagram.com/winuwatch/'
                    className='text-white sm:text-blue-600 underline font-medium'
                    rel='noreferrer'
                    target='_blank'
                  >
                    @winuwatch
                  </Link>
                </div>
              </div>

              <div className='flex flex-1 flex-col items-center justify-center rounded-[5px] md:rounded-[31.77px] bg-foreground px-2 py-6 md:h-12 md:flex-row h-fit gap-[10px] md:gap-[14px] md:border md:bg-background'>
                <PhoneFooter className='h-[25px] w-[25px] text-white sm:text-black' />
                <div className='flex flex-col md:flex-row items-center gap-2 md:gap-[14px]'>
                  <p className='text-[12px] text-white md:text-[15px] md:text-foreground font-bold -tracking-normal text-center'>
                    {Tcomp('contact_us_by_phone')}
                  </p>
                  <Link
                    href='tel:+447488863429'
                    className='text-white sm:text-blue-600 underline font-medium'
                    rel='noreferrer'
                  >
                    +44 748 886 3429
                  </Link>
                </div>
              </div>
            </div>

            <div className='mt-3 inline-flex h-28 w-fit max-w-full flex-col items-center justify-center gap-1 rounded-[5px] bg-foreground px-4 py-3 mx-auto md:mt-2 md:h-12 md:flex-row md:gap-2 md:rounded-[31.77px] md:border md:bg-background md:py-2'>
              <MailFooter className='h-[20px] w-[20px] text-white sm:text-black' />
              <p className='text-[12px] text-white md:text-[15px] md:text-foreground font-bold -tracking-normal text-center'>
                Contact us by email
              </p>
              <Link
                href='mailto:contact@winuwatch.uk'
                className='text-[13px] text-white sm:text-blue-600 underline font-medium text-center'
                rel='noreferrer'
              >
                contact@winuwatch.uk
              </Link>
            </div>
          </div>

          <div className='flex h-full w-full flex-col justify-between gap-6 md:col-span-1 mt-[69px] md:mt-0 '>
            <InstagramMobile instagramCount={instagramCount} isMobile={false} />
            {/* newsletter form */}
            <div className='flex flex-col gap-3'>
              <div>
                <h2 className='text-[20px] font-bold -tracking-normal text-foreground'>
                  {Tcomp('register_to_newsletter')}
                </h2>
                <p className='text-zinc-600 text-[16px] font-bold -tracking-normal'>
                  {Thome('get_early_access')}
                </p>
              </div>
              <NewsletterForm />
            </div>
          </div>

          {/* privacy policy and bottom links */}
          <div className='mb-12 flex flex-col gap-4 md:col-span-3 md:mb-0 md:flex-row md:items-center md:justify-between md:border-t md:pt-2	 mt-[64px] md:mt-0 '>
            {/* privacy policy links */}
            <div className='flex flex-wrap justify-center gap-3 text-zinc-600 md:order-last  md:flex-1  md:justify-evenly  text-[12px] md:text-[14px] -tracking-[0.03em] font-bold'>
              <NextLink href='/acceptable-use-policy'>
                {Tcheckout('acc_use_policy')}
              </NextLink>
              <NextLink href='/terms-and-conditions'>
                {Tcheckout('terms&conds')}
              </NextLink>
              <NextLink href='/disclaimer' className='hidden md:inline-block'>
                {Tcheckout('disclaimer')}
              </NextLink>
              <NextLink href='/return-policy'>{Tcheckout('return')}</NextLink>
              <NextLink href='/privacy-policy'>
                {Tcheckout('privacy_police')}
              </NextLink>
              <NextLink href='/refund-and-cancellation'>
                {Tcheckout('refundpolicy')}
              </NextLink>
            </div>
            {/* copyright  */}
            <div className='flex flex-col items-center justify-center gap-4 md:flex-1 md:items-start md:gap-1 mt-[46px] md:mt-0'>
              <div className='flex items-center justify-center gap-1'>
                <Copyright className='mt-0.5 h-4 w-4 md:h-3 md:w-3' />
                <p className='text-xl font-bold text-foreground md:text-lg '>
                  WINUWATCH
                </p>
                <p className='text-xs font-semibold text-zinc-500 md:text-[10px] flex items-center'>
                  <span>{new Date().getFullYear()}</span>
                  {APP_VERSION && (
                    <>
                      <span className='mx-1'>·</span>
                      <span className='text-indigo-700 font-bold'>
                        · V-{APP_VERSION}
                      </span>
                    </>
                  )}
                </p>
              </div>
              <p className='text-center text-[10px] font-normal text-zinc-600 md:text-start tracking-[0.04em]'>
                Lisam Watch Ltd is registered at 63-66 Hatton Gardens, Fifth
                Floor, Suite 23, London, England, EC1N 8LE
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
