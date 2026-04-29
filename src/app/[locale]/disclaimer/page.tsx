import type { Metadata } from 'next';

export const dynamic = 'force-static';

export const metadata: Metadata = {
  title: 'Win u Watch - Disclaimer',
  description: 'Win u Watch - Disclaimer',
};

import { unstable_setRequestLocale } from 'next-intl/server';

export default function DisclaimerPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  unstable_setRequestLocale(locale);
  return (
    <div className='mt-70 flex flex-col gap-8 p-5 font-medium'>
      <h1 className='text-3xl'>Disclaimer</h1>
      <div className='w-[80%]'>
        <h2 className='text-2xl'>General Information</h2>
        <p>
          {`The information provided by Lisam Watch Ltd ("we," "us," or "our") on
          our website and through other channels is for general informational
          purposes only. All information on the site is provided in good faith,
          however, we make no representation or warranty of any kind, express or
          implied, regarding the accuracy, adequacy, validity, reliability,
          availability, or completeness of any information on the site.`}
        </p>
        <br />
        <h2 className='text-2xl'>External Links Disclaimer</h2>
        <p>
          Our website may contain (or you may be sent through the site) links to
          other websites or content belonging to or originating from third
          parties or links to websites and features in banners or other
          advertising. Such external links are not investigated, monitored, or
          checked for accuracy, adequacy, validity, reliability, availability,
          or completeness by us. We do not warrant, endorse, guarantee, or
          assume responsibility for the accuracy or reliability of any
          information offered by third-party websites linked through the site or
          any website or feature linked in any banner or other advertising. We
          will not be a party to or in any way be responsible for monitoring any
          transaction between you and third-party providers of products or
          services.
        </p>
        <br />
        <h2 className='text-2xl'>Professional Disclaimer</h2>
        <p>
          The site cannot and does not contain legal advice. The legal
          information is provided for general informational and educational
          purposes only and is not a substitute for professional advice.
          Accordingly, before taking any actions based upon such information, we
          encourage you to consult with the appropriate professionals. We do not
          provide any kind of legal advice. The use or reliance of any
          information contained on this site is solely at your own risk.
        </p>
        <br />
        <h2 className='text-2xl'>Limitation of Liability</h2>
        <p>
          In no event shall Lisam Watch Ltd be liable for any special, direct,
          indirect, incidental, consequential, or punitive damages, whether in
          an action of contract, negligence, or other tort, arising out of or in
          connection with the use of or inability to use this website or the
          content on the website. This includes, but is not limited to, any loss
          of profit, loss of revenue, loss of anticipated savings, loss of
          goodwill, loss of business, loss of data, or any other intangible
          losses. Use of the site and reliance on any information provided is
          solely at your own risk.
        </p>
      </div>
    </div>
  );
}
