import { PlayerRowSkeleton, Skeleton } from '@/components/ui/skeleton';

export default function PlayersLoading() {
  return (
    <div className="space-y-6 pt-16 lg:pt-0">
      <div className="flex items-center justify-between">
        <Skeleton className="h-9 w-32" />
        <Skeleton className="h-10 w-36 rounded-xl" />
      </div>

      {/* Invite link skeleton */}
      <div className="bg-white border border-[#E8E4DF] rounded-2xl p-5 space-y-3">
        <Skeleton className="h-5 w-24" />
        <div className="flex gap-2">
          <Skeleton className="h-10 flex-1 rounded-xl" />
          <Skeleton className="h-10 w-20 rounded-xl" />
        </div>
      </div>

      {/* Players list skeleton */}
      <div className="space-y-2">
        <Skeleton className="h-5 w-20 mb-3" />
        {[...Array(6)].map((_, i) => <PlayerRowSkeleton key={i} />)}
      </div>
    </div>
  );
}
