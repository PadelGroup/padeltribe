export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-[#E8E4DF] rounded-lg ${className}`} />
  );
}

export function PlayerRowSkeleton() {
  return (
    <div className="flex items-center gap-3 p-3 bg-white border border-[#E8E4DF] rounded-xl">
      <Skeleton className="w-10 h-10 rounded-full flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-20" />
      </div>
      <Skeleton className="h-6 w-16 rounded-full" />
    </div>
  );
}

export function TournamentCardSkeleton() {
  return (
    <div className="bg-white border border-[#E8E4DF] rounded-2xl p-5 space-y-3">
      <div className="flex items-start justify-between">
        <div className="space-y-2 flex-1">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-6 w-24 rounded-full" />
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>
    </div>
  );
}

export function CommunityCardSkeleton() {
  return (
    <div className="bg-white border border-[#E8E4DF] rounded-2xl p-5 space-y-3">
      <div className="flex items-center gap-3">
        <Skeleton className="w-12 h-12 rounded-xl flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>
      <Skeleton className="h-4 w-full" />
      <div className="flex gap-2">
        <Skeleton className="h-8 flex-1 rounded-xl" />
        <Skeleton className="h-8 flex-1 rounded-xl" />
      </div>
    </div>
  );
}

export function StatCardSkeleton() {
  return (
    <div className="bg-white border border-[#E8E4DF] rounded-2xl p-5 space-y-2">
      <Skeleton className="h-8 w-12" />
      <Skeleton className="h-4 w-24" />
    </div>
  );
}

export function RankingRowSkeleton() {
  return (
    <div className="flex items-center gap-3 p-3 bg-white border border-[#E8E4DF] rounded-xl">
      <Skeleton className="w-7 h-7 rounded-full flex-shrink-0" />
      <Skeleton className="w-9 h-9 rounded-full flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-3 w-16" />
      </div>
      <Skeleton className="h-6 w-12 rounded-full" />
    </div>
  );
}
