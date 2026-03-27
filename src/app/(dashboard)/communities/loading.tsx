import { CommunityCardSkeleton, Skeleton } from '@/components/ui/skeleton';

export default function CommunitiesLoading() {
  return (
    <div className="space-y-6 pt-16 lg:pt-0">
      <div className="flex items-center justify-between">
        <Skeleton className="h-9 w-40" />
        <Skeleton className="h-10 w-44 rounded-xl" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {[...Array(4)].map((_, i) => <CommunityCardSkeleton key={i} />)}
      </div>
    </div>
  );
}
