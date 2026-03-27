import { Skeleton, CommunityCardSkeleton, TournamentCardSkeleton } from '@/components/ui/skeleton';

export default function DashboardLoading() {
  return (
    <div className="space-y-8 pt-16 lg:pt-0">
      {/* Welcome */}
      <div className="space-y-2">
        <Skeleton className="h-9 w-56" />
        <Skeleton className="h-5 w-40" />
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white border border-[#E8E4DF] rounded-2xl p-4 space-y-2">
            <Skeleton className="h-8 w-10" />
            <Skeleton className="h-3 w-20" />
          </div>
        ))}
      </div>

      {/* My communities */}
      <div className="space-y-3">
        <Skeleton className="h-6 w-36" />
        <div className="grid gap-4 sm:grid-cols-2">
          <CommunityCardSkeleton />
          <CommunityCardSkeleton />
        </div>
      </div>

      {/* Upcoming tournaments */}
      <div className="space-y-3">
        <Skeleton className="h-6 w-48" />
        <TournamentCardSkeleton />
        <TournamentCardSkeleton />
      </div>
    </div>
  );
}
