import type { Metadata } from 'next';

export const dynamic = 'force-static';

export const metadata: Metadata = {
  title: 'Win u Watch - Privacy Policy',
  description: 'Win u Watch - Privacy Policy',
};

import { unstable_setRequestLocale } from 'next-intl/server';

export default function PrivacyPolicyPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  unstable_setRequestLocale(locale);
  return (
    <div className='mt-70 flex flex-col gap-8 p-5 font-medium'>
      <h1 className='text-3xl'>Privacy Policy</h1>
      <div className='w-[80%]'>
        <p>
          Lisam Watch Ltd
          <br />
          Company Number: 14717797
          <br />
          Email: contact@winuwatch.com
          <br />
          Address: 63-66 Hatton Gardens, Fifth Floor, Suite 23, London, England,
          EC1N 8LE
        </p>
        <br />
        <h1 className='text-3xl'>Privacy Policy</h1>
        <br />
        <h2 className='text-2xl'>Who are we?</h2>
        <br />
        <p>
          We are Lisam Watch Ltd and we are committed to protecting your
          privacy. If you have any questions about our privacy policy, you can
          contact us at: contact@winuwatch.com.
        </p>
        <br />
        <h2 className='text-2xl'>What is the purpose of this policy?</h2>
        <br />
        <p>
          This policy outlines what happens when we collect personal information
          from you through our website. By using our service, you agree to this
          policy. Please note that this policy only applies to the information
          you provide to us. If you provide personal information to other
          third-party services such as payment providers or other websites,
          please check their respective privacy policies.
        </p>
        <br />
        <h2 className='text-2xl'>Can this policy change?</h2>
        <br />
        <p>
          Yes, we may change this policy from time to time. We encourage you to
          check this page periodically for any updates. By continuing to use our
          service, you agree to the updated policy.
        </p>
        <br />
        <h2 className='text-2xl'>What information do we collect?</h2>
        <br />
        <p>We may collect the following information from you:</p>
        <span className='ml-[10px] font-medium'>
          <p>
            &bull; Information you upload to our service, such as your name and
            contact details, details about your transactions on our service,
            contact or other information which you give or allow us to use for
            newsletters or other marketing, and your communications with us.
          </p>
          <br />
          <p>
            &bull; Automated information about your use of our service, such as
            the internet protocol (IP) address used to connect your device to
            the internet, connection information such as browser type and
            version, information about your device including device-type and
            device identifier, operating system and platform, mobile network
            data, a unique reference number linked to the data you enter on our
            system, login details, the site from which you arrived at our
            service, details of your activity with date/time stamps including
            pages you visited and your searches/transactions.
          </p>
          <br />
          <p>
            &bull; The following information about you may be provided to us by
            other people: limited billing information sent to us by our payment
            provider for verification purposes, such as your name, email
            address, and billing address.
          </p>
        </span>
        <br />
        <h2 className='text-2xl'>Why do we collect this information?</h2>
        <br />
        <p>We collect this information for the following reasons:</p>
        <span className='ml-[10px] font-medium'>
          <p>
            &bull; To take steps at your request to enter into a contract with
            you and/or to perform such a contract, such as sending service
            messages, processing payments, and fulfilling orders.
          </p>
          <br />
          <p>
            &bull; To manage and improve our service, including tracking usage
            patterns and preventing or detecting fraud or abuse.
          </p>
          <br />
          <p>
            &bull; With your permission, to send you newsletters or other
            marketing materials.
          </p>
          <br />
          <p>
            &bull;{' '}
            {`If you supply us with someone else's email address for a
            "Refer A Friend" or similar offer, to send a referral message to
            that person.`}
          </p>
        </span>
        <br />
        <h2 className='text-2xl'>How long do we keep personal information?</h2>
        <br />
        <p>
          We keep personal information indefinitely. You can close your account
          by emailing us at the above email address. Even after your account is
          closed, we may retain some of your information if reasonably needed
          for legal, regulatory, or tax reasons, to deal with disputes, prevent
          fraud or abuse, and/or enforce our terms and conditions.
        </p>
        <br />
        <h2 className='text-2xl'>
          To whom do we send or make available your personal information?
        </h2>
        <br />
        <p>
          We may share your personal information with the following third-party
          service providers:
        </p>
        <span className='ml-[10px] font-medium'>
          <p>
            &bull; Delivery companies, website hosts, payment providers,
            businesses which help us send communications or monitor our website,
            and which provide us with e-commerce analytics and other IT
            services.
          </p>
          <br />
          <p>
            &bull; Law enforcement authorities to help deal with fraud and abuse
            and/or comply with legal requirements.
          </p>
          <br />
          <p>
            &bull; Insurers and professional advisers in connection with our
            insurance cover or to deal with legal claims.
          </p>
          <br />
          <p>
            &bull; Potential buyers in the case of an actual or proposed
            (including negotiations for a) sale or merger or business
            combination involving all or the relevant part of our business.
          </p>
        </span>
        <br />
        <h2 className='text-2xl'>
          Do we send your information outside the European Union?
        </h2>
        <br />
        <p>
          {`Your personal information which we collect is stored within the EU and
          is not transferred to any third countries except as follows: Your
          personal information may be transferred to the US by the following
          companies certified under the EU-US Privacy Shield Framework which
          provides certain safeguards for your personal information: Google
          (analytics), Facebook (advertising), Mailchimp, and Mandrill (email
          delivery).`}
        </p>
        <br />
        <h2 className='text-2xl'>What about cookies?</h2>
        <br />
        <p>
          {` We and/or other companies use cookies and other tracking technologies
          on our website. Cookies are identifiers (small files of letters and
          numbers) that are sent to your web browser. Cookies are widely used to
          make websites work or work more efficiently as well as to provide
          information to the website owner or others. Some are temporary
          'session' cookies that remain in the cookie file of your browser only
          until your browser is closed, whereas persistent cookies stay for
          longer (depending on the lifetime of the specific cookie).`}
        </p>
        <br />
        <p>
          {`For further information on cookies, including how to use your browser
          to block them and how to delete existing cookies, you can click here.
          Note that if you configure your browser to reject cookies, our site's
          functionality will be limited. Companies which provide us with a
          service also place cookies. Some of these cookies (e.g., from Google)
          may involve certain information such as your IP address and the web
          address of the page you’re visiting being sent to the company
          concerned.`}
        </p>
        <br />
        <h2 className='text-2xl'>How do analytics cookies work?</h2>
        <br />
        <p>
          Analytics cookies help us track the number of visitors to our website
          and provide us with information about their visits. This information
          includes the duration of their visit, the pages they viewed, and where
          they came from. This helps us improve our website and ensure that
          users can find what they need easily. These cookies are provided by
          Google Analytics.
        </p>
        <br />
        <h2 className='text-2xl'>What are advertising cookies used for?</h2>
        <br />
        <p>
          Advertising cookies are used to personalize ads on our site and other
          sites based on your use of our site. They also help measure ad
          effectiveness, such as how often you click on or view ads and whether
          you make a purchase from the advertiser. These cookies are provided by
          Google and Facebook.
        </p>
        <br />
        <h2 className='text-2xl'>What are payment provider cookies?</h2>
        <br />
        <p>
          Payment provider cookies are placed by our payment provider Paypal if
          you use their payment services on our site. These cookies help ensure
          that your payment transactions are secure and that our payment system
          functions properly.
        </p>
        <br />
        <h2 className='text-2xl'>What rights do you have?</h2>
        <br />
        <p>
          {`If the legal requirements are met, you have the right to ask us for
          access to your personal information, to rectify it if there are
          mistakes, to delete or restrict its use in certain circumstances, to
          'data portability,' or to withdraw any consent you ’ve given (e.g.,
          marketing). You may also have the right to object to the use of your
          personal information in certain circumstances.`}
        </p>
        <br />
        <p>
          {` If you have a complaint about how we are dealing with your personal
          information, please contact us via the email address above. If you are
          not happy with our response or think we are not handling your personal
          information in accordance with the law, you have the right to complain
          to the Information Commissioner's Office (ICO). For more information
          about your rights, visit the ICO's website.`}
        </p>
        <br />
        <h2 className='text-2xl'>Contact us</h2>
        <br />
        <p>
          If you have any questions or concerns about this privacy policy or our
          use of your personal information, please contact us via email at
          contact@winuwatch.com or write to us at the address listed on our
          website.
        </p>
        <br />
        <h2 className='text-2xl'>Effective date</h2>
        <br />
        <p>April 2023</p>
      </div>
    </div>
  );
}
