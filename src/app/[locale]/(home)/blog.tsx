'use client';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { type FrontMatterType } from '../feed/[slug]/post-layout';
import { type ReactElement } from 'react';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { usePathname } from '@/navigation';

export function Blog({
  className,
  posts,
}: {
  className?: string;
  posts: (FrontMatterType & { slug: string; content: ReactElement })[] | [];
}) {
  const pathname = usePathname();
  const isDesktop = useMediaQuery('(min-width: 768px)');
  // const numPostsToShow =
  //   isDesktop && pathname === '/'
  //     ? 4
  //     : isDesktop && pathname !== '/'
  //       ? posts.length
  //       : !isDesktop && pathname === '/'
  //         ? 2
  //         : posts.length;
  const numPostsToShow =
    isDesktop && (pathname === '/' || pathname.includes('account/dashboard'))
      ? 4
      : !isDesktop &&
          (pathname === '/' || pathname.includes('account/dashboard'))
        ? 2
        : posts.length;

  return (
    <div className={cn('flex flex-col gap-16', className)}>
      <div className='grid grid-cols-1 gap-4 lg:grid-cols-3'>
        {posts.slice(0, numPostsToShow).map((post, index) => (
          <div
            key={index}
            className={cn({
              'lg:col-span-2': (index + Math.floor(index / 2)) % 2 !== 0,
              'lg:col-span-1': (index + Math.floor(index / 2)) % 2 === 0,
            })}
          >
            <Article {...post} />
          </div>
        ))}
      </div>
    </div>
  );
}

export function Article({
  image,
  slug,
  title,
  publishedAt,
}: FrontMatterType & { slug: string }) {
  return (
    <Link href={`/feed/${slug}`}>
      <div className='group w-full '>
        <div className='h-[436px] w-full md:h-[484px]  relative '>
          <Image
            src={image}
            alt={title}
            width={1200}
            height={900}
            sizes='(min-width: 1024px) 66vw, 100vw'
            className='object-cover object-center w-full h-full '
          />
          <div className='absolute inset-0 w-full h-full group-hover:bg-white/20 transition-all duration-500  ease-[cubic-bezier 0.38, 0.01, 0.38, 1)] ' />
        </div>
        <div className='flex w-full h-[107px] md:h-[75px] flex-col justify-center gap-1 py-3 px-4 text-primary group-hover:bg-foreground group-hover:text-background  overflow-hidden transition-all duration-500  ease-[cubic-bezier 0.38, 0.01, 0.38, 1)] '>
          <p className='text-[18px] font-bold -tracking-[0.03em] truncate'>
            {title}
          </p>
          <p className='text-[13px] font-medium -tracking-[0.03em]'>
            {publishedAt}
          </p>
        </div>
      </div>
    </Link>
  );
}
