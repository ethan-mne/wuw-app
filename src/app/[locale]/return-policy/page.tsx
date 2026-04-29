import type { Metadata } from 'next';

export const dynamic = 'force-static';

export const metadata: Metadata = {
  title: 'Lisam Watch Ltd - Return Policy',
  description: 'Lisam Watch Ltd - Return Policy',
};
import { unstable_setRequestLocale } from 'next-intl/server';

const ReturnPolicyPage = ({
  params: { locale },
}: {
  params: { locale: string };
}) => {
  unstable_setRequestLocale(locale);
  return (
    <div className='mt-70 flex flex-col gap-8 p-5 font-medium'>
      <h1 className='text-3xl'>Return Policy</h1>
      <p className='w-[80%]'>
        For the company Lisam Watch Ltd, our returns policy is as follows:{' '}
        <br />
        <span className='ml-[10px] font-medium'>
          <br />
          <p>
            1. Returns Due: to the nature of prize competitions, Lisam Watch Ltd
            operates a no returns or refund policy. Once an entry has been
            submitted and payment has been made, it is considered final and
            cannot be cancelled, refunded or returned for any reason.
          </p>
          <br />
          <p>
            2. Faulty Products: If you receive a product from Lisam Watch Ltd
            that is faulty or damaged, please contact our customer service team
            at <a href='mailto:contact@winuwatch.com'>contact@winuwatch.com</a>{' '}
            We will assess the issue and provide a solution which may include a
            repair, replacement or refund at our discretion.
          </p>
          <br />
          <p>
            3. Delivery Errors: If you receive a product that is not what you
            ordered, or if it is missing parts or components, please contact our
            customer service team at{' '}
            <a href='mailto:contact@winuwatch.com'>contact@winuwatch.com</a> .
            We will investigate the issue and provide a solution which may
            include a replacement or refund at our discretion.
          </p>
          <br />
          <p>
            4. Shipping Costs: Lisam Watch Ltd is not responsible for the cost
            of shipping returns, repairs or replacements. Customers are
            responsible for ensuring that any returned products are adequately
            packaged and insured to prevent damage during transit.
          </p>
          <br />
          <p>
            5. Processing Time If: a refund is approved, it will be processed
            within 14 business days from the date of approval. The refunded
            amount will be credited to the original payment method used to make
            the purchase.
          </p>
        </span>
        <br />
        Please note that this policy does not affect your statutory rights as a
        consumer under applicable law.
        <br />
        <br />
      </p>
    </div>
  );
};

export default ReturnPolicyPage;
