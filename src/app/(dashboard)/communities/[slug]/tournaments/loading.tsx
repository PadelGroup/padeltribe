import { Skeleton, TournamentCardSkeleton } from '@/components/ui/skeleton';

export default function TournamentsLoading() {
  return (
    <div className="space-y-6 pt-16 lg:pt-0">
      <div className="flex items-center justify-between">
        <Skeleton className="h-9 w-40" />
        <Skeleton className="h-10 w-44 rounded-xl" />
      </div>
      <div className="space-y-3">
        {[...Array(4)].map((_, i) => <TournamentCardSkeleton key={i} />)}
      </div>
    </div>
  );
}
