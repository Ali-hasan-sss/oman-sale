export function HeroSectionSkeleton() {
  return (
    <section className="relative flex h-[100dvh] max-h-[100dvh] min-h-0 flex-col overflow-hidden bg-slate-300">
      <div className="relative z-10 shrink-0 px-4 py-3 sm:py-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
          <div className="h-12 w-36 animate-pulse rounded-2xl bg-white/40 sm:h-14" />
          <div className="h-10 w-28 animate-pulse rounded-xl bg-white/30" />
        </div>
        <div className="mx-auto mt-3 max-w-3xl animate-pulse rounded-xl bg-white/35 py-4 sm:mt-4 sm:py-5" />
      </div>
      <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-4 pb-16">
        <div className="w-full max-w-3xl space-y-4 text-center">
          <div className="mx-auto h-10 w-4/5 animate-pulse rounded-full bg-white/40 sm:h-12" />
          <div className="mx-auto h-6 w-3/5 animate-pulse rounded-full bg-white/30 sm:h-8" />
          <div className="mx-auto h-11 w-40 animate-pulse rounded-xl bg-white/45" />
        </div>
      </div>
    </section>
  );
}

export function HeroBannersSkeleton() {
  return (
    <section className="bg-slate-50 px-4 pt-12 md:pt-16">
      <div className="mx-auto mb-5 max-w-[1010px] text-center">
        <div className="mx-auto h-8 w-48 animate-pulse rounded-full bg-slate-200" />
        <div className="mx-auto mt-3 h-4 w-80 max-w-full animate-pulse rounded-full bg-slate-100" />
      </div>
      <div className="mx-auto max-w-[1010px] overflow-hidden rounded-2xl ring-1 ring-slate-200">
        <div className="aspect-[990/250] w-full animate-pulse bg-slate-200" />
      </div>
      <div className="mx-auto mt-6 flex justify-center">
        <div className="h-11 w-44 animate-pulse rounded-full bg-slate-200" />
      </div>
    </section>
  );
}

export function CategoriesSectionSkeleton() {
  return (
    <div className="mb-8 grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-6">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="overflow-hidden rounded-2xl bg-white shadow-sm">
          <div className="flex flex-col items-center p-6">
            <div className="h-10 w-10 animate-pulse rounded-xl bg-slate-200" />
            <div className="mt-4 h-4 w-20 animate-pulse rounded-full bg-slate-200" />
            <div className="mt-2 h-3 w-14 animate-pulse rounded-full bg-slate-100" />
          </div>
          <div className="h-9 animate-pulse border-t border-slate-100 bg-slate-50" />
        </div>
      ))}
    </div>
  );
}

export function TourismSectionSkeleton() {
  return (
    <>
      <section className="mb-14 overflow-hidden rounded-3xl bg-gradient-to-br from-slate-300 to-slate-400 p-8 md:p-12">
        <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-2">
          <div className="grid grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-48 animate-pulse rounded-2xl bg-white/25" />
            ))}
          </div>
          <div className="space-y-4">
            <div className="ms-auto h-10 w-4/5 animate-pulse rounded-full bg-white/35" />
            <div className="ms-auto h-20 w-full animate-pulse rounded-2xl bg-white/25" />
            <div className="grid grid-cols-3 gap-6">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="h-14 animate-pulse rounded-xl bg-white/20" />
              ))}
            </div>
            <div className="ms-auto h-11 w-36 animate-pulse rounded-xl bg-white/35" />
          </div>
        </div>
      </section>

      <section className="mb-14">
        <div className="mb-8 text-center">
          <div className="mx-auto h-4 w-28 animate-pulse rounded-full bg-brand-100" />
          <div className="mx-auto mt-3 h-8 w-56 animate-pulse rounded-full bg-slate-200" />
          <div className="mx-auto mt-2 h-4 w-72 max-w-full animate-pulse rounded-full bg-slate-100" />
        </div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="h-52 animate-pulse rounded-2xl bg-slate-200" />
          ))}
        </div>
      </section>
    </>
  );
}

export function CreateStoreBannerSkeleton() {
  return (
    <section className="mx-auto max-w-7xl px-4 pb-2 pt-8">
      <div className="h-28 animate-pulse rounded-3xl bg-slate-200 sm:h-24" />
    </section>
  );
}
