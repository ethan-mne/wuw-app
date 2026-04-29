'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import styles from '@/styles/Dashboard.module.css';
import { useSession, signOut } from 'next-auth/react';
import { Bell, Search, User, Settings, LogOut } from 'lucide-react';

const DashboardNav = () => {
  const { data: session } = useSession();

  return (
    <nav className={styles.Nav}>
      <div className={styles.navLeft}>
        <div className={styles.searchContainer}>
          <Search className={styles.searchIcon} size={18} />
          <Input
            type='text'
            placeholder='Search competitions, orders, users...'
            className='w-[320px] pl-8'
          />
        </div>
      </div>

      <div className={styles.navRight}>
        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant='ghost'
              size='icon'
              className='relative rounded-xl border border-[#e7ded2] bg-white hover:bg-[#f7f3ed]'
            >
              <Bell className='h-5 w-5' />
              <span className='absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-[10px] font-medium text-white flex items-center justify-center'>
                2
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className='z-[2200] w-[320px] rounded-xl border border-[#e6ddd2] bg-white/95 p-2 shadow-2xl backdrop-blur'
            align='end'
            sideOffset={10}
          >
            <DropdownMenuLabel className='px-2 py-2 font-normal'>
              <div className='flex flex-col space-y-1'>
                <p className='text-[14px] font-semibold text-[#2f2923]'>
                  Notifications
                </p>
                <p className='text-[12px] text-[#7b6f63]'>
                  You have 2 unread messages
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem className='cursor-pointer rounded-lg px-3 py-2'>
                <div className='flex flex-col space-y-1'>
                  <p className='text-[14px] font-medium text-[#302921]'>
                    New order received
                  </p>
                  <p className='text-[12px] text-[#7b6f63]'>2 minutes ago</p>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem className='cursor-pointer rounded-lg px-3 py-2'>
                <div className='flex flex-col space-y-1'>
                  <p className='text-[14px] font-medium text-[#302921]'>
                    Your campaign is live
                  </p>
                  <p className='text-[12px] text-[#7b6f63]'>1 hour ago</p>
                </div>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem className='cursor-pointer justify-center rounded-lg px-3 py-2 text-[13px] font-medium text-[#7b6f63]'>
              Mark all as read
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User Profile */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant='ghost'
              className='relative h-8 w-8 rounded-full border border-[#e7ded2] bg-white hover:bg-[#f7f3ed]'
            >
              <Avatar className='h-8 w-8'>
                <AvatarImage
                  src={session?.user?.image ?? undefined}
                  alt='Profile'
                />
                <AvatarFallback>
                  {session?.user?.name?.[0] ?? 'U'}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className='z-[2200] w-56 rounded-xl border border-[#e6ddd2] bg-white/95 p-2 shadow-2xl backdrop-blur'
            align='end'
            sideOffset={10}
          >
            <DropdownMenuLabel className='font-normal'>
              <div className='flex flex-col space-y-1'>
                <p className='text-sm font-medium leading-none'>
                  {session?.user?.name}
                </p>
                <p className='text-xs leading-none text-muted-foreground'>
                  {session?.user?.email}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem>
                <User className='mr-2 h-4 w-4' />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className='mr-2 h-4 w-4' />
                <span>Settings</span>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => signOut()}>
              <LogOut className='mr-2 h-4 w-4' />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </nav>
  );
};

export default DashboardNav;
