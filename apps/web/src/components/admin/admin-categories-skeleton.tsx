export function CategoriesSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <div className="flex flex-col gap-4 px-4 py-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex min-w-0 flex-1 items-start gap-3">
              <div className="mt-1 h-10 w-10 shrink-0 animate-pulse rounded-lg bg-slate-200" />
              <div className="h-11 w-11 shrink-0 animate-pulse rounded-xl bg-slate-200" />
              <div className="min-w-0 flex-1 space-y-2">
                <div className="h-4 w-44 animate-pulse rounded-full bg-slate-200" />
                <div className="h-3 w-36 animate-pulse rounded-full bg-slate-100" />
                <div className="flex flex-wrap gap-2">
                  <div className="h-6 w-20 animate-pulse rounded-full bg-slate-100" />
                  <div className="h-6 w-16 animate-pulse rounded-full bg-slate-100" />
                  <div className="h-6 w-14 animate-pulse rounded-full bg-slate-100" />
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <div className="h-9 w-28 animate-pulse rounded-lg bg-slate-200" />
              <div className="h-9 w-24 animate-pulse rounded-lg bg-slate-200" />
              <div className="h-9 w-24 animate-pulse rounded-lg bg-slate-200" />
              <div className="h-9 w-28 animate-pulse rounded-lg bg-slate-200" />
            </div>
          </div>
          {index % 2 === 0 ? (
            <div className="border-t border-slate-100 bg-slate-50/60 ms-11 border-s-2 border-slate-200 ps-4 py-3 md:ms-14 md:ps-5">
              <div className="space-y-3">
                {Array.from({ length: 2 }).map((_, childIndex) => (
                  <div key={childIndex} className="flex items-center gap-3 border-b border-slate-100 pb-3 last:border-b-0">
                    <div className="h-10 w-10 shrink-0 animate-pulse rounded-lg bg-slate-200" />
                    <div className="h-9 w-9 shrink-0 animate-pulse rounded-xl bg-slate-200" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3.5 w-32 animate-pulse rounded-full bg-slate-200" />
                      <div className="h-3 w-24 animate-pulse rounded-full bg-slate-100" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
}
