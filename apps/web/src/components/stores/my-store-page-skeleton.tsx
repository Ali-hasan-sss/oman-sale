function MyStoreListingRowSkeleton() {
  return (
    <div className="flex gap-4 rounded-2xl border border-gray-100 p-4">
      <div className="h-24 w-28 shrink-0 animate-pulse rounded-xl bg-slate-200" />
      <div className="flex flex-1 flex-col justify-center gap-2">
        <div className="h-5 w-3/4 animate-pulse rounded-full bg-slate-200" />
        <div className="h-4 w-1/3 animate-pulse rounded-full bg-slate-100" />
        <div className="h-5 w-24 animate-pulse rounded-full bg-slate-200" />
      </div>
    </div>
  );
}

function SidebarCardSkeleton({ lines = 4 }: { lines?: number }) {
  return (
    <div className="rounded-3xl bg-white p-6 shadow-sm md:p-8">
      <div className="mb-4 h-7 w-36 animate-pulse rounded-full bg-slate-200" />
      <div className="mb-4 h-7 w-20 animate-pulse rounded-full bg-slate-100" />
      <div className="space-y-3">
        {Array.from({ length: lines }).map((_, index) => (
          <div key={index} className="h-4 animate-pulse rounded-full bg-slate-100" style={{ width: `${70 + (index % 3) * 10}%` }} />
        ))}
      </div>
      <div className="mt-6 h-12 w-full animate-pulse rounded-xl bg-slate-200" />
    </div>
  );
}

export function MyStorePageSkeleton() {
  return (
    <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
      <div className="space-y-6">
        <div className="overflow-hidden rounded-3xl bg-white shadow-sm">
          <div className="h-48 animate-pulse bg-slate-200" />
          <div className="p-6 md:p-8">
            <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end">
              <div className="-mt-16 h-28 w-28 shrink-0 animate-pulse rounded-2xl border-4 border-white bg-slate-200 shadow" />
              <div className="flex flex-wrap gap-2">
                <div className="h-10 w-32 animate-pulse rounded-xl bg-slate-200" />
                <div className="h-10 w-28 animate-pulse rounded-xl bg-slate-100" />
              </div>
            </div>

            <div className="mb-2 h-8 w-2/5 animate-pulse rounded-full bg-slate-200" />
            <div className="mb-6 h-4 w-1/4 animate-pulse rounded-full bg-slate-100" />

            <div className="grid gap-5">
              <div>
                <div className="mb-2 h-4 w-24 animate-pulse rounded-full bg-slate-200" />
                <div className="h-28 animate-pulse rounded-xl bg-slate-100" />
              </div>
              <div>
                <div className="mb-2 h-4 w-28 animate-pulse rounded-full bg-slate-200" />
                <div className="h-28 animate-pulse rounded-xl bg-slate-100" />
              </div>
            </div>

            <div className="mt-6 h-12 w-40 animate-pulse rounded-xl bg-slate-200" />
          </div>
        </div>

        <section className="rounded-3xl bg-white p-6 shadow-sm md:p-8">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div className="h-7 w-36 animate-pulse rounded-full bg-slate-200" />
            <div className="h-10 w-36 animate-pulse rounded-xl bg-slate-200" />
          </div>
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <MyStoreListingRowSkeleton key={index} />
            ))}
          </div>
        </section>
      </div>

      <aside className="space-y-6">
        <SidebarCardSkeleton lines={5} />
        <SidebarCardSkeleton lines={3} />
        <div className="rounded-3xl border border-red-100 bg-white p-6 shadow-sm md:p-8">
          <div className="mb-2 h-6 w-28 animate-pulse rounded-full bg-red-100" />
          <div className="mb-4 h-4 w-full animate-pulse rounded-full bg-slate-100" />
          <div className="h-12 w-full animate-pulse rounded-xl bg-red-100" />
        </div>
      </aside>
    </div>
  );
}
