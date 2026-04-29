import { Skeleton } from '@/components/ui/skeleton';

export function CompetitionsListSkeleton() {
  const itemsCount = 2;
  return (
    <div className='flex flex-col gap-8'>
      {Array.from({ length: itemsCount }, (_, i) => {
        return (
          <div className='flex flex-col gap-4' key={i}>
            <Skeleton className='w-2/5 h-[30px] md:h-[50px] bg-muted-foreground ' />
            <Skeleton className='w-full h-[102px] md:h-[150px] bg-muted-foreground' />
          </div>
        );
      })}
    </div>
  );
}
