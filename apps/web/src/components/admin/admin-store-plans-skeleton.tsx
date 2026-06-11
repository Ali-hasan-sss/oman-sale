export function AdminStorePlansSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="flex h-full flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="min-h-[9.5rem] animate-pulse bg-slate-200" />
          <div className="flex flex-1 flex-col p-6">
            <div className="mb-4 flex-1 space-y-2">
              <div className="h-4 w-4/5 animate-pulse rounded-full bg-slate-200" />
              <div className="h-4 w-3/5 animate-pulse rounded-full bg-slate-100" />
              <div className="h-4 w-2/3 animate-pulse rounded-full bg-slate-100" />
              <div className="h-4 w-4/5 animate-pulse rounded-full bg-slate-100" />
              <div className="h-4 w-3/5 animate-pulse rounded-full bg-slate-100" />
            </div>
            <div className="mt-auto h-12 animate-pulse rounded-xl bg-slate-100" />
          </div>
        </div>
      ))}
    </div>
  );
}
