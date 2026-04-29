import type { Metadata } from 'next';

export const dynamic = 'force-static';

export const metadata: Metadata = {
  title: 'Refund & Cancellation Policy | WinuWatch',
  description:
    'WinuWatch refund and cancellation policy for competition tickets.',
};

import { unstable_setRequestLocale } from 'next-intl/server';

export default function RefundAndCancellationPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  unstable_setRequestLocale(locale);
  return (
    <main className='container mx-auto px-4 py-8 max-w-3xl'>
      <h1 className='text-2xl font-bold mb-6'>Refund & Cancellation Policy</h1>

      <section className='space-y-6'>
        <div>
          <p className='font-semibold mb-2'>Lisam Watch Ltd</p>
          <p>Company Number: 14717797</p>
          <p>Email: contact@winuwatch.com</p>
          <p>Website: www.winuwatch.com</p>
          <p>
            Address: 63-66 Hatton Gardens, Fifth Floor, Suite 23, London,
            England, EC1N 8LE
          </p>
          <p className='mt-2 italic'>
            Note: Winuwatch.com is a trade name of Lisam Watch Ltd.
          </p>
        </div>

        <div>
          <h2 className='text-xl font-semibold mb-2'>
            Non-Refundable Ticket Purchases
          </h2>
          <p>
            All ticket purchases for skill-based competitions organized by Lisam
            Watch Ltd are final and non-refundable. By purchasing a ticket,
            participants acknowledge and agree that they will not be entitled to
            a refund under any circumstances, except in the rare event that the
            competition is canceled by Lisam Watch Ltd.
          </p>
        </div>

        <div>
          <h2 className='text-xl font-semibold mb-2'>
            Competition Cancellation
          </h2>
          <p>
            If a competition is canceled by Lisam Watch Ltd, participants will
            be notified via email. In this case, a full refund will be issued
            for any tickets purchased for that competition. The refund will be
            processed to the original payment method used at the time of
            purchase. Lisam Watch Ltd reserves the right to cancel any
            competition at its discretion.
          </p>
        </div>

        <div>
          <h2 className='text-xl font-semibold mb-2'>
            Chargebacks and Payment Reversals
          </h2>
          <p>
            Entries will be automatically canceled if any payments are reversed
            or charged back by the payment provider. Unwarranted chargebacks may
            result in the forfeiture of prizes and suspension of accounts.
            Participants with unresolved chargebacks may be ineligible for
            future competitions.
          </p>
        </div>

        <div>
          <h2 className='text-xl font-semibold mb-2'>
            Identification and Compliance Requirements
          </h2>
          <p>
            Upon winning, Lisam Watch Ltd may request proof of identity, age,
            and ownership of the payment method used. Failure to provide the
            required documents within five days of notification may result in
            forfeiture of the prize. Tickets are also non-transferable, and only
            the purchaser is eligible to claim the prize, provided they meet all
            competition requirements.
          </p>
        </div>

        <div>
          <h2 className='text-xl font-semibold mb-2'>Transaction Descriptor</h2>
          <p>
            Please note that the transaction for ticket purchases will appear on
            your bank or credit card statement as &apos;LISAM WATCH LTD&apos;.
            If you have any questions about a transaction, we encourage you to
            contact us directly at contact@winuwatch.com before initiating a
            chargeback. We are committed to addressing any concerns promptly.
          </p>
        </div>

        <div>
          <h2 className='text-xl font-semibold mb-2'>Liability and Losses</h2>
          <p>
            Lisam Watch Ltd is not liable for any losses incurred where there is
            no breach of legal duty or where the loss is unforeseeable.
            Additionally, we are not responsible for losses resulting from a
            participant&apos;s own actions or from the participant&apos;s
            business use of our service. Any foreseeable losses we incur due to
            a participant&apos;s breach of this policy or misuse of our service
            may be claimed back from the participant.
          </p>
        </div>

        <div>
          <h2 className='text-xl font-semibold mb-2'>Contact Information</h2>
          <p>
            For any questions regarding our Refund & Cancellation Policy, please
            reach out to us at:
          </p>
          <p className='mt-2'>Email: contact@winuwatch.com</p>
          <p>Website: www.winuwatch.com</p>
          <p>
            Address: 63-66 Hatton Gardens, Fifth Floor, Suite 23, London,
            England, EC1N 8LE
          </p>
          <p>Company Number: 14717797</p>
        </div>
      </section>
    </main>
  );
}
