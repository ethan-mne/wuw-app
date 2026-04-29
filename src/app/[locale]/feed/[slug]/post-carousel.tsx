import { buttonVariants } from '@/components/ui/button';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import { cn } from '@/lib/utils';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { Link as NextLink } from '@/navigation';
import { type FrontMatterType } from './post-layout';
import { Article } from '../../(home)/blog';
import { useTranslations } from 'next-intl';
import { helveticaMedium } from '@/lib/fonts';

export function PostsCarousel({
  posts,
}: {
  posts: (FrontMatterType & { slug: string })[];
}) {
  const Tfeed = useTranslations('feed');
  return (
    <div className='space-y-5 p-4'>
      <p className={`${helveticaMedium.className} font-bold text-[22px]`}>
        More articles that might interest you
      </p>
      <Carousel
        className='flex w-full max-w-full flex-col gap-9'
        opts={{
          align: 'start',
        }}
      >
        <CarouselContent className='-ml-4 w-full'>
          {posts.map((post, index) => (
            <CarouselItem
              key={post.title}
              className='max-w-[324px] pl-4 md:max-w-[549px]  lg:basis-1/2 xl:basis-1/3'
            >
              <Article {...post} />
            </CarouselItem>
          ))}
        </CarouselContent>
        {/* // carousel controls */}
        <div className='flex items-center justify-center  gap-6 px-2'>
          <CarouselPrevious className='group border-none bg-white shadow hover:bg-white flex md:hidden'>
            <ArrowLeft className='h-4 w-4 text-primary group-hover:scale-150 group-hover:text-secondary' />
          </CarouselPrevious>
          <NextLink
            target='_blank'
            rel='noreferrer'
            href='/feed'
            className={cn(
              buttonVariants({ variant: 'outline' }),
              'group order-first inline-flex w-[150px] my-16 rounded-md border-none bg-foreground text-background hover:bg-foreground  hover:text-background md:order-none md:w-[300px] ',
            )}
          >
            <span className='group-hover:scale-90 group-hover:font-normal'>
              {Tfeed('view_all_articles')}
            </span>
          </NextLink>
          <CarouselNext className='group border-none bg-white shadow hover:bg-white  flex md:hidden'>
            <ArrowRight className='h-4 w-4 text-primary group-hover:scale-150 group-hover:text-secondary' />
          </CarouselNext>
        </div>
      </Carousel>
    </div>
  );
}
