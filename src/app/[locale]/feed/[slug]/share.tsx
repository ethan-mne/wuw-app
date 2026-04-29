import { Facebook, Twitter, FilledMail, ShareLink } from '@/components/icons';
import Link from 'next/link';

export function Share() {
  return (
    <div className='flex items-center gap-4'>
      <Link href='/'>
        <Facebook className='w-6 h-6' />
      </Link>
      <Link href='/'>
        <Twitter className='w-6 h-6' />
      </Link>
      <Link href='/'>
        <FilledMail className='w-6 h-6 fill-[#898989]' />
      </Link>
      <Link href='/'>
        <ShareLink className='w-6 h-6' />
      </Link>
    </div>
  );
}
