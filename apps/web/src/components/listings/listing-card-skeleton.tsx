export function ListingCardsSkeleton({ count = 8, variant = 'grid' }: { count?: number; variant?: 'grid' | 'list' }) {
  if (variant === 'list') {
    return (
      <div className="space-y-6">
        {Array.from({ length: count }).map((_, index) => (
          <ListingListSkeleton key={index} />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, index) => (
        <ListingGridSkeleton key={index} />
      ))}
    </div>
  );
}

export function ListingGridSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl bg-white shadow-sm">
      <div className="relative h-56 animate-pulse bg-slate-200">
        <div className="absolute right-3 top-3 h-9 w-9 rounded-full bg-white/80" />
        <div className="absolute left-3 top-3 h-6 w-20 rounded-md bg-white/80" />
      </div>
      <div className="space-y-3 p-4">
        <div className="h-4 w-4/5 animate-pulse rounded-full bg-slate-200" />
        <div className="h-6 w-1/2 animate-pulse rounded-full bg-slate-200" />
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 animate-pulse rounded-full bg-slate-200" />
          <div className="h-4 w-2/3 animate-pulse rounded-full bg-slate-200" />
        </div>
      </div>
    </div>
  );
}

function ListingListSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
      <div className="flex flex-col gap-6 p-6 md:flex-row">
        <div className="h-48 w-full flex-shrink-0 animate-pulse rounded-lg bg-slate-200 md:w-64" />
        <div className="flex-1 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="w-full max-w-lg space-y-3">
              <div className="h-6 w-3/4 animate-pulse rounded-full bg-slate-200" />
              <div className="h-4 w-1/2 animate-pulse rounded-full bg-slate-200" />
              <div className="h-7 w-32 animate-pulse rounded-full bg-slate-200" />
            </div>
            <div className="h-7 w-24 animate-pulse rounded-full bg-slate-200" />
          </div>
          <div className="flex flex-wrap gap-4">
            <div className="h-4 w-24 animate-pulse rounded-full bg-slate-200" />
            <div className="h-4 w-36 animate-pulse rounded-full bg-slate-200" />
            <div className="h-4 w-28 animate-pulse rounded-full bg-slate-200" />
          </div>
          <div className="flex flex-wrap gap-3 pt-2">
            <div className="h-10 w-20 animate-pulse rounded-lg bg-slate-200" />
            <div className="h-10 w-20 animate-pulse rounded-lg bg-slate-200" />
            <div className="h-10 w-24 animate-pulse rounded-lg bg-slate-200" />
            <div className="h-10 w-24 animate-pulse rounded-lg bg-slate-200" />
          </div>
        </div>
      </div>
    </div>
  );
}
