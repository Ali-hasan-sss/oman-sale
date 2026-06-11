export function ArticleCardsSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, index) => (
        <ArticleCardSkeleton key={index} />
      ))}
    </div>
  );
}

function ArticleCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="h-48 animate-pulse bg-slate-200" />
      <div className="space-y-3 p-5">
        <div className="h-6 w-4/5 animate-pulse rounded-full bg-slate-200" />
        <div className="h-4 w-full animate-pulse rounded-full bg-slate-100" />
        <div className="h-4 w-full animate-pulse rounded-full bg-slate-100" />
        <div className="h-4 w-2/3 animate-pulse rounded-full bg-slate-100" />
        <div className="flex gap-3 pt-1">
          <div className="h-3 w-16 animate-pulse rounded-full bg-slate-200" />
          <div className="h-3 w-12 animate-pulse rounded-full bg-slate-200" />
          <div className="h-3 w-12 animate-pulse rounded-full bg-slate-200" />
          <div className="h-3 w-12 animate-pulse rounded-full bg-slate-200" />
        </div>
        <div className="h-9 w-32 animate-pulse rounded-xl bg-brand-50" />
      </div>
    </div>
  );
}

export function ArticleDetailSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 lg:items-start lg:gap-6">
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="aspect-[4/3] animate-pulse bg-slate-200" />
        <div className="grid grid-cols-4 gap-2 p-3 sm:grid-cols-5">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="aspect-square animate-pulse rounded-xl bg-slate-100" />
          ))}
        </div>
      </div>

      <div className="min-w-0 space-y-5 lg:space-y-6">
        <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5 lg:p-6">
          <div className="mb-3 h-6 w-24 animate-pulse rounded-full bg-brand-50" />
          <div className="h-10 w-full animate-pulse rounded-full bg-slate-200" />
          <div className="mt-2 h-10 w-4/5 animate-pulse rounded-full bg-slate-200" />
          <div className="mt-4 flex gap-4">
            <div className="h-4 w-28 animate-pulse rounded-full bg-slate-100" />
            <div className="h-4 w-24 animate-pulse rounded-full bg-slate-100" />
          </div>
          <div className="mt-6 flex gap-3 border-y border-slate-100 py-4">
            <div className="h-10 w-28 animate-pulse rounded-full bg-slate-100" />
            <div className="h-10 w-24 animate-pulse rounded-full bg-slate-100" />
            <div className="h-10 w-24 animate-pulse rounded-full bg-slate-100" />
          </div>
          <div className="mt-8 space-y-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="h-4 animate-pulse rounded-full bg-slate-100"
                style={{ width: index === 5 ? '70%' : '100%' }}
              />
            ))}
          </div>
        </div>

        <ArticleCommentsSkeleton withWrapper />
      </div>
    </div>
  );
}

export function ArticleCommentsSkeleton({
  count = 3,
  withWrapper = false
}: {
  count?: number;
  withWrapper?: boolean;
}) {
  const content = (
    <>
      {withWrapper ? <div className="mb-4 h-7 w-32 animate-pulse rounded-full bg-slate-200" /> : null}
      <ul className="space-y-4">
        {Array.from({ length: count }).map((_, index) => (
          <li key={index} className="flex gap-3 border-b border-slate-100 pb-4 last:border-0">
            <div className="h-10 w-10 shrink-0 animate-pulse rounded-full bg-slate-200" />
            <div className="min-w-0 flex-1 space-y-2">
              <div className="flex gap-2">
                <div className="h-4 w-28 animate-pulse rounded-full bg-slate-200" />
                <div className="h-3 w-24 animate-pulse rounded-full bg-slate-100" />
              </div>
              <div className="h-4 w-full animate-pulse rounded-full bg-slate-100" />
              <div className="h-4 w-5/6 animate-pulse rounded-full bg-slate-100" />
            </div>
          </li>
        ))}
      </ul>
      <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200">
        <div className="flex items-stretch">
          <div className="h-12 flex-1 animate-pulse bg-slate-50" />
          <div className="h-12 w-14 animate-pulse bg-slate-200 sm:w-28" />
        </div>
      </div>
    </>
  );

  if (!withWrapper) return content;

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5 lg:p-6">
      {content}
    </div>
  );
}
