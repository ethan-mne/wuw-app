import Head from 'next/head';
import Link from 'next/link';
import styles from '@/styles/Terms.module.css';

const Return_Policy = () => {
  return (
    <div className={styles.TermsCon}>
      <Head>
        <title>Win u Watch - Return Policy</title>
        <meta name='description' content='Win u Watch - Return Policy' />
        <meta name='viewport' content='width=device-width, initial-scale=1' />
        <link rel='icon' href='/favicon.ico' />
      </Head>
      <Link href='/'>Home</Link>
      <div className={styles.TermsTxt}>
        <h1>Return Policy</h1>
        <p className={styles.MainP}>
          For the company Lisam Watch Ltd trading as Win U Watch, our returns
          policy is as follows: <br />
          <span className={styles.span}>
            <br />
            <p>
              1. Returns Due: to the nature of prize competitions, Win U Watch
              operates a no returns or refund policy. Once an entry has been
              submitted and payment has been made, it is considered final and
              cannot be cancelled, refunded or returned for any reason.
            </p>
            <br />
            <p>
              2. Faulty Products: If you receive a product from Win U Watch that
              is faulty or damaged, please contact our customer service team at{' '}
              <a href='mailto:contact@winuwatch.uk'>contact@winuwatch.uk</a> We
              will assess the issue and provide a solution which may include a
              repair, replacement or refund at our discretion.
            </p>
            <br />
            <p>
              3. Delivery Errors: If you receive a product that is not what you
              ordered, or if it is missing parts or components, please contact
              our customer service team at{' '}
              <a href='mailto:contact@winuwatch.uk'>contact@winuwatch.uk</a> .
              We will investigate the issue and provide a solution which may
              include a replacement or refund at our discretion.
            </p>
            <br />
            <p>
              4. Shipping Costs: Win U Watch is not responsible for the cost of
              shipping returns, repairs or replacements. Customers are
              responsible for ensuring that any returned products are adequately
              packaged and insured to prevent damage during transit.
            </p>
            <br />
            <p>
              5. Processing Time If: a refund is approved, it will be processed
              within 14 business days from the date of approval. The refunded
              amount will be credited to the original payment method used to
              make the purchase.
            </p>
          </span>
          <br />
          Please note that this policy does not affect your statutory rights as
          a consumer under applicable law.
          <br />
          <br />
        </p>
      </div>
    </div>
  );
};

export default Return_Policy;
