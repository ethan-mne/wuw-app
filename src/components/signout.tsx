'use client';
import { signOut } from 'next-auth/react';
import { Button } from './ui/button';

export function SignOut() {
  return (
    <Button
      variant={'ghost'}
      onClick={() => signOut()}
      className='hover:bg-transparent m-0 p-0'
    >
      <span className='text-[16px] -tracking-[0.03em] text-foreground font-bold'>
        Logout
      </span>
    </Button>
  );
}
