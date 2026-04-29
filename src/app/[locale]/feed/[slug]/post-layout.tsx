import Image from 'next/image';
import { Author } from './author';
import PageTitle from './page-title';
import type { ReactElement } from 'react';
import { Share } from './share';
import { helveticaMedium } from '@/lib/fonts';

export interface FrontMatterType {
  title: string;
  image: string;
  summary: string;
  authorName: string;
  publishedAt: string;
  authorImage: string;
  imports: string[];
}

interface PostLayoutProps {
  content: ReactElement;
  frontMatter: FrontMatterType;
}

export function PostLayout({ content, frontMatter }: PostLayoutProps) {
  const { title, summary, authorImage, authorName, publishedAt, image } =
    frontMatter;

  return (
    <article className='w-full lg:w-[97%] mx-auto my-10 flex flex-col items-center'>
      <header className='space-y-6'>
        <div className='space-y-2 p-4'>
          <PageTitle>{title}</PageTitle>
          <p className='font-medium text-[18px] md:text-[20px] text-[#898989] md:text-center'>
            {summary}
          </p>
        </div>
        <div className='flex flex-col p-4 md:flex-row md:items-center justify-between gap-8 md:gap-0'>
          <Author
            authorImage={authorImage}
            authorName={authorName}
            publishedAt={publishedAt}
          />
          <Share />
        </div>
        <Image
          src={image}
          width={0}
          height={0}
          sizes='100vw'
          alt={title}
          className='w-full lg:p-4 min-h-[400px] object-cover object-center bg-center'
        />
      </header>
      <div className={`w-full md:w-4/5 mt-5 ${helveticaMedium.className}`}>
        {content}
      </div>

      <footer className='w-full md:w-4/5 p-4'>
        <div className='flex flex-col gap-6 '>
          <Author
            authorImage={authorImage}
            authorName={authorName}
            publishedAt={publishedAt}
          />
          <div className='space-y-4'>
            <p className='font-bold text-[24px] text-foreground'>
              Share article
            </p>
            <Share />
          </div>
        </div>
      </footer>
    </article>
  );
}
