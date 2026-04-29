import type { Metadata } from 'next';

export const dynamic = 'force-static';

export const metadata: Metadata = {
  title: 'Win u Watch - Terms & Conditions',
  description: 'Win u Watch - Terms & Conditions',
};

import { unstable_setRequestLocale } from 'next-intl/server';

export default function TermsAndConditionsPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  unstable_setRequestLocale(locale);
  return (
    <div className='mt-70 flex flex-col gap-8 p-5 font-medium'>
      <h1 className='text-3xl'>Terms & Conditions</h1>
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
        <h1 className='text-3xl'>Competition</h1>
        <br />
        <h2 className='text-2xl'>Entry</h2>
        <br />
        <p>{`
          The skill-based competition is organized by Lisam Watch Ltd, whose
          contact information is available on our website. Participants must be
          18 years or older. Employees of Lisam Watch Ltd and their families, as
          well as anyone connected professionally with the competition, are
          ineligible to participate. Participants must ensure the accuracy of
          the contact details they provide. To enter, participants must select
          the number of tickets, choose the correct answer to a skill-based
          question, and pay for the tickets. All ticket purchases are final and
          non-refundable. By purchasing a ticket, you acknowledge and agree that
          you will not be entitled to a refund, regardless of the competition
          outcome, unless the competition is canceled by Lisam Watch Ltd. Entry
          is only confirmed once payment is received and acknowledged by us. We
          are not responsible for incomplete, delayed, damaged, or unreceived
          entries for any reason. Only one answer can be selected per order, and
          this answer will apply to all tickets in that order. Compliance with
          these terms and any other competition requirements on our website is
          mandatory. Non-compliant entries may be excluded at our discretion.
          Entries will be canceled if any payments are reversed or charged back.
          The skill-based competition will close on the date specified on our
          website or when the tickets are sold out. Upon successful payment, you
          will receive a confirmation email with your order details. Please note
          that the transaction will appear on your bank or credit card statement
          as 'LISAM WATCH LTD' to help you easily identify the charge.
        `}</p>
        <br />
        <h2 className='text-2xl'>Prizes</h2>
        <br />
        <p>
          {`Winners will be randomly drawn from all correct entries within 14 days of the competition's closing date. Winners will be notified via the email address provided and prizes sent to the postal address given. If contact cannot be made or delivery fails despite reasonable attempts, the prize will be forfeited, and we reserve the right to offer the prize to another entrant. Prizes are as specified on our website and may be substituted with one of equivalent value at our discretion. No cash alternatives will be provided. Delivery times are not guaranteed. It is the winner's responsibility to contact us if the prize is not received within a reasonable time. Winners outside the UK are responsible for any applicable taxes, duties, VAT, and shipping costs. Prizes are provided 'as is' without any guarantees regarding quality or suitability.`}
        </p>
        <br />
        <h2 className='text-2xl'>Winners</h2>
        <br />
        <p>
          Upon winning, Lisam Watch Ltd will request proof of identity, age, and
          ownership of the payment card used. Participants must confirm they are
          18 years of age or older before entering any competition. Lisam Watch
          Ltd reserves the right to verify age upon winning, and non-compliance
          may result in disqualification. If the card was not legally theirs,
          proof of authorization must be provided before the prize is awarded.
          Proof must be provided within five days of notification. Winners will
          be informed of their prize and must confirm their acceptance and prize
          choice in writing within five days of notification. Delivery
          arrangements must be agreed upon within seven days of prize
          confirmation. Failure to comply with the timeframes may result in
          forfeiture of the prize and selection of an alternative winner.
          Winners may be required to participate in promotional activities,
          including providing photographs or videos, which may be used by Lisam
          Watch Ltd in marketing and public relations materials across various
          media channels. Winners consent to this use but can withdraw consent
          in writing before publication. All materials will become the property
          of Lisam Watch Ltd. Entrants from certain restricted countries,
          including Cuba, Iran, Venezuela, the Crimean region, North Korea,
          Myanmar, Belarus, and Mali, are not eligible, and any entries will be
          refunded.
        </p>
        <br />
        <h2 className='text-2xl'>Liability</h2>
        <br />
        <p>
          {`We do not exclude liability for death or personal injury caused by our negligence, fraud, or fraudulent misrepresentation. We are not liable for losses where there is no breach of legal duty, where the loss was not reasonably foreseeable, where the loss was caused by the entrant, or where the loss relates to the entrant's business. Entrants are liable for any foreseeable losses we incur due to their breach of these terms or misuse of our service.`}
        </p>
        <br />
        <h2 className='text-2xl'>General</h2>
        <br />
        <p>
          Our decisions regarding the competition are final. Winners will be
          selected using a third-party random number generator, and certificates
          of the draw are available upon request. We reserve the right to cancel
          the competition at any time, in which case any payments will be
          refunded. Consumer cooling-off rights do not apply as this is a
          contract for leisure activities with a specific date for performance.
          Notices under these terms will be sent by email to the most recent
          address provided by the entrant. If any part of these terms is found
          to be unenforceable, the remaining terms will continue to apply. These
          terms are governed by English law, and disputes will be resolved in UK
          courts.
        </p>
        <br />
        <h1 className='text-3xl'>Website</h1>
        <br />
        <h2 className='text-2xl'>Introduction</h2>
        <br />
        <p>
          This website is operated by Lisam Watch Ltd. Contact information is
          available at the end of this document. These terms replace any
          previous versions. Please print or save a copy for future reference.
          Use of this website is subject to these terms. Entering competitions
          is subject to separate terms and conditions.
        </p>
        <br />
        <h2 className='text-2xl'>Changes to Terms</h2>
        <br />
        <p>
          We may update these terms at any time by posting a revised version on
          our website. Continued use of the website indicates acceptance of the
          revised terms.
        </p>
        <br />
        <h2 className='text-2xl'>Acceptable Use Policy</h2>
        <br />
        <p>
          Users must not breach any laws, infringe rights, use the website for
          spam or fraudulent schemes, disrupt the website, gain unauthorized
          access, use automated means to interact with the site, or assist
          others in such actions.
        </p>
        <br />
        <h2 className='text-2xl'>Content</h2>
        <br />
        <p>
          We do not guarantee the accuracy of information on our website, and
          users rely on it at their own risk.
        </p>
        <br />
        <h2 className='text-2xl'>Third-Party Websites and Services</h2>
        <br />
        <p>
          {`We are not responsible for third-party websites, advertising, or services linked on our site. Use of third-party sites is at the user's own risk.`}
        </p>
        <br />
        <h2 className='text-2xl'>Privacy</h2>
        <br />
        <p>
          Personal information is processed according to our privacy and cookies
          policy, which may change over time.
        </p>
        <br />
        <h2 className='text-2xl'>Website Functionality</h2>
        <br />
        <p>
          We do not guarantee uninterrupted or error-free website operation and
          are not liable for losses due to such issues. We may suspend or change
          the website without notice.
        </p>
        <br />
        <h2 className='text-2xl'>Account Use</h2>
        <br />
        <p>
          Accounts are for personal use and non-transferable. Users must keep
          login information confidential and notify us of any security breaches.
          We may terminate accounts at any time without notice.
        </p>
        <br />
        <h2 className='text-2xl'>Liability</h2>
        <br />
        <p>
          {`We do not exclude liability for death or personal injury caused by our negligence, fraud, or fraudulent misrepresentation. If you have any concerns about a charge on your account, please contact us first at contact@winuwatch.com. We are committed to resolving any issues promptly. Unwarranted chargebacks may result in the forfeiture of prizes and suspension of accounts. We are not liable for losses where there is no breach of legal duty, where the loss was not reasonably foreseeable, where the loss was caused by the entrant, or where the loss relates to the entrant's business. Entrants are liable for any foreseeable losses we incur due to their breach of these terms or misuse of our service.`}
        </p>
        <br />
        <h2 className='text-2xl'>Intellectual Property Rights</h2>
        <br />
        <p>
          All material on the website is owned by us or our suppliers. Users may
          view material for personal use only and must not otherwise use it
          without consent.
        </p>
        <br />
        <h2 className='text-2xl'>English Law</h2>
        <br />
        <p>
          These terms are governed by English law, and disputes will be resolved
          in UK courts. Consumers will benefit from mandatory provisions of
          their local law.
        </p>
        <br />
        <h2 className='text-2xl'>General</h2>
        <br />
        <p>
          Notices will be sent by email to the address provided by the user. If
          any part of these terms is unenforceable, the rest will continue to
          apply. We may transfer these terms to a third party.
        </p>
        <br />
        <h2 className='text-2xl'>Complaints</h2>
        <br />
        <p>Complaints can be sent to contact@winuwatch.com</p>
        <br />
        <h2 className='text-2xl'>Restrictions</h2>
        <br />
        <p>
          Players from Germany are not allowed to participate due to legal
          restrictions.
        </p>
      </div>
    </div>
  );
}
