import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { helveticaMedium } from '@/lib/fonts';

export function Author({
  authorName,
  authorImage,
  publishedAt,
}: {
  authorName: string;
  authorImage: string;
  publishedAt: string;
}) {
  return (
    <div className={`flex items-center gap-4 ${helveticaMedium.className}`}>
      <Avatar>
        <AvatarImage src={authorImage} />
        <AvatarFallback>{authorName?.slice(0, 2).toUpperCase()}</AvatarFallback>
      </Avatar>
      <div className=''>
        <p className='font-bold text-[16px] text-foreground'>
          Posted By {authorName}
        </p>
        <p className='font-medium text-[14px] text-[#898989]'>{publishedAt}</p>
      </div>
    </div>
  );
}
