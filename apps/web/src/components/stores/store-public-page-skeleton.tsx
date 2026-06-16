import { ListingCardsSkeleton } from '@/components/listings/listing-card-skeleton';

export function StorePublicPageSkeleton() {
  return (
    <>
      <section className="h-52 animate-pulse bg-slate-200 md:h-72" aria-hidden="true" />

      <section className="bg-gray-50 pb-8">
        <div className="site-container">
          <div className="relative z-10 -mt-14 md:-mt-[4.5rem]">
            <div className="rounded-3xl border border-white/50 bg-white/55 p-6 shadow-xl backdrop-blur-md md:p-8">
              <div className="flex flex-col gap-6 md:flex-row md:items-start">
                <div className="-mt-16 h-24 w-24 shrink-0 animate-pulse rounded-2xl border-4 border-white/80 bg-slate-200 shadow-lg md:-mt-20 md:h-28 md:w-28" />
                <div className="min-w-0 flex-1 space-y-4 md:pt-2">
                  <div className="h-4 w-28 animate-pulse rounded-full bg-slate-200" />
                  <div className="h-9 w-2/5 animate-pulse rounded-full bg-slate-200" />
                  <div className="h-6 w-24 animate-pulse rounded-full bg-slate-100" />
                  <div className="space-y-2 pt-1">
                    <div className="h-4 w-full animate-pulse rounded-full bg-slate-100" />
                    <div className="h-4 w-5/6 animate-pulse rounded-full bg-slate-100" />
                    <div className="h-4 w-3/4 animate-pulse rounded-full bg-slate-100" />
                  </div>
                  <div className="flex flex-wrap gap-4 pt-2">
                    <div className="h-4 w-24 animate-pulse rounded-full bg-slate-200" />
                    <div className="h-4 w-28 animate-pulse rounded-full bg-slate-200" />
                    <div className="h-4 w-20 animate-pulse rounded-full bg-slate-200" />
                  </div>
                  <div className="flex items-center gap-3 pt-1">
                    <div className="h-10 w-10 animate-pulse rounded-full bg-slate-200" />
                    <div className="h-4 w-40 animate-pulse rounded-full bg-slate-100" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <main className="site-container pb-12">
        <section className="mb-8">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div className="h-8 w-40 animate-pulse rounded-full bg-slate-200" />
            <div className="h-4 w-16 animate-pulse rounded-full bg-slate-100" />
          </div>
          <ListingCardsSkeleton count={8} />
        </section>
      </main>
    </>
  );
}
