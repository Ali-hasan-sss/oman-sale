const tdClass = 'px-2 py-2 align-middle text-start lg:px-2.5';

export function AdminStoresTableSkeleton({ rows = 10 }: { rows?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <tr key={rowIndex} className="border-b border-slate-100">
          <td className={tdClass}>
            <div className="flex items-center gap-2">
              <div className="h-9 w-9 shrink-0 animate-pulse rounded-lg bg-slate-200" />
              <div className="min-w-0 space-y-1.5">
                <div className="h-3 w-[72%] max-w-28 animate-pulse rounded-full bg-slate-200" />
                <div className="h-2.5 w-[55%] max-w-20 animate-pulse rounded-full bg-slate-100" />
              </div>
            </div>
          </td>
          <td className={tdClass}>
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 shrink-0 animate-pulse rounded-full bg-slate-200" />
              <div className="min-w-0 space-y-1.5">
                <div className="h-3 w-[80%] max-w-32 animate-pulse rounded-full bg-slate-200" />
                <div className="h-2.5 w-[90%] max-w-36 animate-pulse rounded-full bg-slate-100" />
              </div>
            </div>
          </td>
          <td className={tdClass}>
            <div className="h-3 w-[70%] max-w-20 animate-pulse rounded-full bg-slate-200" />
          </td>
          <td className={tdClass}>
            <div className="space-y-1.5">
              <div className="h-3 w-[75%] max-w-28 animate-pulse rounded-full bg-slate-200" />
              <div className="h-2.5 w-[85%] max-w-32 animate-pulse rounded-full bg-slate-100" />
            </div>
          </td>
          <td className={tdClass}>
            <div className="h-5 w-14 animate-pulse rounded-full bg-slate-200" />
          </td>
          <td className={tdClass}>
            <div className="h-3 w-6 animate-pulse rounded-full bg-slate-200" />
          </td>
          <td className={tdClass}>
            <div className="h-5 w-12 animate-pulse rounded-full bg-slate-200" />
          </td>
          <td className={tdClass}>
            <div className="h-7 w-7 animate-pulse rounded-lg bg-slate-200" />
          </td>
        </tr>
      ))}
    </>
  );
}
