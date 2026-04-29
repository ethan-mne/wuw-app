import { LayoutWrapper } from '@/components/layout-wrapper';
import { Stepper } from '../stepper';
export default function PaymentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <LayoutWrapper className='container mx-auto mt-10 px-4 md:px-6'>
      <div className='flex flex-col gap-8 md:gap-16 max-w-7xl mx-auto'>
        <Stepper active={4} className='mt-6 hidden md:flex' />
        {/* {isConfirmation ? ( */}
        {children}
        {/*  
        // ) : (
        //   <div className='grid grid-cols-1 xl:grid-cols-3 gap-8 w-full'>
        //     <div className='xl:col-span-2 space-y-6'>
        //       <div className='w-full'>{children}</div>
        //     </div>
        //     <div className='xl:col-span-1'>
        //       <PaymentSummary
        //         competition={competitionData.competition}
        //         order={order}
        //         ticketCount={order._count.Ticket}
        //         disabled
        //       />
        //     </div>
        //   </div>
        // )*/}
      </div>
    </LayoutWrapper>
  );
}
