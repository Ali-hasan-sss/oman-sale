export function ListingDetailSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <div className="mb-6 overflow-hidden rounded-2xl bg-white shadow-sm">
          <div className="h-96 animate-pulse bg-slate-200" />
          <div className="grid grid-cols-4 gap-2 p-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="aspect-video animate-pulse rounded-lg bg-slate-100" />
            ))}
          </div>
        </div>

        <div className="mb-6 rounded-2xl bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-start justify-between gap-4">
            <div className="flex-1 space-y-3">
              <div className="h-6 w-24 animate-pulse rounded-full bg-slate-100" />
              <div className="h-9 w-4/5 animate-pulse rounded-full bg-slate-200" />
              <div className="flex gap-4">
                <div className="h-4 w-28 animate-pulse rounded-full bg-slate-100" />
                <div className="h-4 w-32 animate-pulse rounded-full bg-slate-100" />
                <div className="h-4 w-20 animate-pulse rounded-full bg-slate-100" />
              </div>
            </div>
            <div className="h-10 w-32 animate-pulse rounded-full bg-slate-200" />
          </div>
          <div className="space-y-3 border-t border-gray-200 pt-6">
            <div className="h-6 w-24 animate-pulse rounded-full bg-slate-200" />
            <div className="h-4 w-full animate-pulse rounded-full bg-slate-100" />
            <div className="h-4 w-full animate-pulse rounded-full bg-slate-100" />
            <div className="h-4 w-5/6 animate-pulse rounded-full bg-slate-100" />
          </div>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <div className="mb-4 h-6 w-36 animate-pulse rounded-full bg-slate-200" />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="overflow-hidden rounded-lg border border-gray-100">
                <div className="h-32 animate-pulse bg-slate-200" />
                <div className="space-y-2 p-3">
                  <div className="h-4 w-4/5 animate-pulse rounded-full bg-slate-100" />
                  <div className="h-5 w-20 animate-pulse rounded-full bg-slate-200" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <aside className="lg:col-span-1">
        <div className="sticky top-4 rounded-2xl bg-white p-6 shadow-sm">
          <div className="mb-4 h-6 w-40 animate-pulse rounded-full bg-slate-200" />
          <div className="mb-6 flex items-center gap-3">
            <div className="h-14 w-14 animate-pulse rounded-full bg-slate-200" />
            <div className="space-y-2">
              <div className="h-5 w-32 animate-pulse rounded-full bg-slate-200" />
              <div className="h-4 w-24 animate-pulse rounded-full bg-slate-100" />
            </div>
          </div>
          <div className="mb-6 space-y-3">
            <div className="h-12 w-full animate-pulse rounded-lg bg-slate-200" />
            <div className="h-12 w-full animate-pulse rounded-lg bg-slate-100" />
          </div>
          <div className="space-y-2 border-t border-gray-200 pt-4">
            <div className="h-4 w-full animate-pulse rounded-full bg-slate-100" />
            <div className="h-4 w-4/5 animate-pulse rounded-full bg-slate-100" />
          </div>
          <div className="mt-6 h-24 animate-pulse rounded-lg bg-amber-50" />
        </div>
      </aside>
    </div>
  );
}
