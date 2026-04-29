import { Skeleton } from '@/components/ui/skeleton';

export function HistoryListSkeleton({ itemsCount }: { itemsCount: number }) {
  return (
    <div className='flex flex-col gap-8'>
      {Array.from({ length: itemsCount }, (_, i) => {
        return (
          <Skeleton
            className='w-full md:h-[148px] h-[123px] bg-muted-foreground'
            key={i}
          />
        );
      })}
    </div>
  );
}
