export function CreateStorePlansSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="flex h-full flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm"
        >
          <div className="min-h-[7.5rem] animate-pulse bg-slate-200" />
          <div className="flex flex-1 flex-col p-5">
            <div className="mb-4 flex-1 space-y-2">
              <div className="h-4 w-4/5 animate-pulse rounded-full bg-slate-200" />
              <div className="h-4 w-3/5 animate-pulse rounded-full bg-slate-100" />
              <div className="h-4 w-2/3 animate-pulse rounded-full bg-slate-100" />
              <div className="h-4 w-4/5 animate-pulse rounded-full bg-slate-100" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function CreateStoreBillingPeriodsSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="mx-auto mb-3 h-4 w-24 animate-pulse rounded-full bg-slate-200" />
          <div className="mx-auto mb-2 h-8 w-32 animate-pulse rounded-full bg-slate-200" />
          <div className="mx-auto h-3 w-20 animate-pulse rounded-full bg-slate-100" />
        </div>
      ))}
    </div>
  );
}
