export function AdminPageLoader({ label = 'Loading dashboard...', dir = 'ltr' }: { label?: string; dir?: 'ltr' | 'rtl' }) {
  return (
    <div className="min-h-screen bg-slate-100 px-4 py-6 lg:px-8" dir={dir}>
      <AdminContentLoader label={label} />
    </div>
  );
}

export function AdminContentLoader({ label = 'Loading dashboard...' }: { label?: string }) {
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="rounded-3xl bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-3">
            <div className="h-4 w-32 animate-pulse rounded-full bg-slate-200" />
            <div className="h-7 w-56 animate-pulse rounded-full bg-slate-200" />
          </div>
          <div className="h-10 w-28 animate-pulse rounded-xl bg-slate-200" />
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        {[0, 1, 2].map((item) => (
          <div key={item} className="rounded-3xl bg-white p-5 shadow-sm">
            <div className="h-4 w-24 animate-pulse rounded-full bg-slate-200" />
            <div className="mt-5 h-8 w-16 animate-pulse rounded-full bg-slate-200" />
            <div className="mt-4 h-3 w-full animate-pulse rounded-full bg-slate-100" />
          </div>
        ))}
      </div>

      <div className="rounded-3xl bg-white p-6 shadow-sm">
        <div className="mb-5 h-5 w-40 animate-pulse rounded-full bg-slate-200" />
        <div className="space-y-3">
          {[0, 1, 2, 3].map((item) => (
            <div key={item} className="h-16 animate-pulse rounded-2xl bg-slate-100" />
          ))}
        </div>
      </div>

      <p className="text-center text-sm font-bold text-slate-500">{label}</p>
    </div>
  );
}
