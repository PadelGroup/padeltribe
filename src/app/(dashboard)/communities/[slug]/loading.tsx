import { Skeleton, TournamentCardSkeleton } from '@/components/ui/skeleton';

export default function CommunityLoading() {
  return (
    <div className="space-y-6 pt-16 lg:pt-0">
      {/* Header */}
      <div className="bg-white border border-[#E8E4DF] rounded-2xl p-5">
        <div className="flex items-center gap-4">
          <Skeleton className="w-16 h-16 rounded-2xl flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-4 w-32" />
            <div className="flex gap-2 mt-2">
              <Skeleton className="h-6 w-20 rounded-full" />
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white border border-[#E8E4DF] rounded-2xl p-4 space-y-2">
            <Skeleton className="h-8 w-10" />
            <Skeleton className="h-3 w-16" />
          </div>
        ))}
      </div>

      {/* Tournaments */}
      <div className="space-y-3">
        <Skeleton className="h-6 w-32" />
        <TournamentCardSkeleton />
        <TournamentCardSkeleton />
      </div>
    </div>
  );
}
