import { formatDistanceToNow } from 'date-fns';

export default function MaintenancePage() {
  const targetDate = new Date('2024-04-08T00:00:00'); // Replace with your target date and time
  return (
    <div className='flex flex-col items-center justify-center h-screen'>
      <h1 className='text-3xl font-bold'>Site is under maintenance</h1>
      <p className='mt-4 text-lg text-gray-500'>
        We are currently working on the site. Please check back in{' '}
        {formatDistanceToNow(targetDate, {
          addSuffix: true,
          includeSeconds: true,
        })}
      </p>
    </div>
  );
}
