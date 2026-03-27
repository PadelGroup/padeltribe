import { Skeleton, RankingRowSkeleton } from '@/components/ui/skeleton';

export default function RankingsLoading() {
  return (
    <div className="space-y-6 pt-16 lg:pt-0">
      <Skeleton className="h-9 w-32" />

      {/* Top 3 podium */}
      <div className="grid grid-cols-3 gap-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white border border-[#E8E4DF] rounded-2xl p-4 flex flex-col items-center gap-2">
            <Skeleton className="w-14 h-14 rounded-full" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-6 w-12 rounded-full" />
          </div>
        ))}
      </div>

      {/* Rest of rankings */}
      <div className="space-y-2">
        {[...Array(8)].map((_, i) => <RankingRowSkeleton key={i} />)}
      </div>
    </div>
  );
}
