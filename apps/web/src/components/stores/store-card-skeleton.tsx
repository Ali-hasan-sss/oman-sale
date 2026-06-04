export function StoreCardsSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: count }).map((_, index) => (
        <StoreCardSkeleton key={index} />
      ))}
    </div>
  );
}

function StoreCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
      <div className="relative h-40 animate-pulse bg-slate-200">
        <div className="absolute bottom-3 start-3 h-11 w-11 rounded-xl bg-slate-300 ring-2 ring-white" />
      </div>
      <div className="space-y-3 p-4">
        <div className="h-5 w-3/4 animate-pulse rounded-full bg-slate-200" />
        <div className="h-6 w-24 animate-pulse rounded-full bg-slate-100" />
        <div className="h-4 w-full animate-pulse rounded-full bg-slate-100" />
        <div className="h-4 w-5/6 animate-pulse rounded-full bg-slate-100" />
        <div className="flex gap-3 pt-1">
          <div className="h-3 w-16 animate-pulse rounded-full bg-slate-200" />
          <div className="h-3 w-20 animate-pulse rounded-full bg-slate-200" />
        </div>
      </div>
    </div>
  );
}

export function FilterChipsSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="filter-chips-scroll flex gap-2 overflow-x-auto pb-2">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="h-9 shrink-0 animate-pulse rounded-full bg-slate-200"
          style={{ width: index === 0 ? 88 : 72 + (index % 3) * 16 }}
        />
      ))}
    </div>
  );
}
