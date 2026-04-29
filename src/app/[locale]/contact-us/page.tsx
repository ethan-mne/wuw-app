export const dynamic = 'force-static';

import {
  LocationFooter,
  MailFooter,
  PhoneFooter,
  WinuwatchRounded,
  Instagradient,
  Whatsapp,
} from '@/components/icons';
import { helveticaMedium, helvetica } from '@/lib/fonts';
// import ContactForm from './ContactForm'; // Temporarily commented out
import { getTranslations } from 'next-intl/server';

import { unstable_setRequestLocale } from 'next-intl/server';

const ContactUsPage = async ({
  params: { locale },
}: {
  params: { locale: string };
}) => {
  unstable_setRequestLocale(locale);
  const t = await getTranslations('contactus');
  return (
    <section
      className={`${helveticaMedium.className} min-h-screen flex flex-col justify-center items-center space-y-10 py-20`}
    >
      <div className='flex flex-col gap-4 w-fit mx-auto items-center p-4'>
        <h1 className={`text-3xl ${helvetica.className}`}>{t(`contact_us`)}</h1>
        <p className='text-black/30'>
          Contact us via Instagram or WhatsApp for quick support!
        </p>
      </div>
      <div className='flex justify-center items-center w-full max-w-screen-lg mx-auto px-4'>
        <div className='bg-black/90 rounded-2xl p-6 space-y-5 sm:space-y-11 flex flex-col justify-between max-w-[480px] w-full items-center sm:items-start'>
          <div className='space-y-3'>
            <h2 className='text-white sm:text-[#00d171] text-xl'>
              {t(`contact`)}
            </h2>
            <p className='text-white/60 text-sm'>
              Reach out to us on Instagram or WhatsApp
            </p>
          </div>
          <div className='flex flex-col sm:flex-row items-center gap-3 sm:gap-5 text-white text-sm'>
            <Instagradient className='text-[#00d171] w-[30px] h-[30px]' />
            <div className='flex flex-col items-center sm:items-start'>
              <p>Follow us on Instagram</p>
              <a
                href='https://www.instagram.com/winuwatch/'
                target='_blank'
                rel='noreferrer'
                className='text-[#00d171] underline'
              >
                @winuwatch
              </a>
            </div>
          </div>
          <div className='flex flex-col sm:flex-row items-center gap-3 sm:gap-5 text-white text-sm'>
            <Whatsapp className='fill-[#00d171] w-[30px] h-[30px]' />
            <div className='flex flex-col items-center sm:items-start'>
              <p>Contact us on WhatsApp</p>
              <a
                href='https://wa.me/447488863429'
                target='_blank'
                rel='noreferrer'
                className='text-[#00d171] underline'
              >
                +44 748 886 3429
              </a>
            </div>
          </div>
          <div className='flex flex-col sm:flex-row items-center gap-3 sm:gap-5 text-white text-sm'>
            <PhoneFooter className='text-[#00d171] w-[20px] h-[20px]' />
            <a
              href='tel:+447488863429'
              className='text-[#00d171] underline'
              rel='noreferrer'
            >
              +44 748 886 3429
            </a>
          </div>
          <div className='flex flex-col sm:flex-row items-center gap-3 sm:gap-5 text-white text-sm'>
            <MailFooter className='text-[#00d171] w-[20px] h-[20px]' />
            <a
              href='mailto:contact@winuwatch.uk'
              className='text-[#00d171] underline'
              rel='noreferrer'
            >
              contact@winuwatch.uk
            </a>
          </div>
          <div className='flex flex-col sm:flex-row items-center gap-3 sm:gap-5 text-white text-sm'>
            <LocationFooter className='text-[#00d171] w-[20px] h-[20px]' />
            <p>5O Princes street, Ipswich, Suffolk, IP1 1RJ, UK</p>
          </div>
          <div className='flex items-center gap-5 text-white text-sm'>
            <WinuwatchRounded className='text-[#00d171] w-[30px] h-[30px]' />
            <p>Winuwatch Family</p>
          </div>
        </div>
        {/* Contact form temporarily hidden */}
        {/* <ContactForm /> */}
      </div>
    </section>
  );
};

export default ContactUsPage;
