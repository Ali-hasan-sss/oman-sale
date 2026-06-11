export type AdminTableSkeletonColumnType =
  | 'avatar-text'
  | 'badge'
  | 'badges'
  | 'text'
  | 'short'
  | 'actions';

type AdminTableSkeletonProps = {
  columnTypes: AdminTableSkeletonColumnType[];
  rows?: number;
  minWidth?: string;
  /** When true, renders only <tr> rows for use inside an existing <tbody>. */
  asBodyOnly?: boolean;
  className?: string;
};

const defaultActionCount = 4;
const defaultBadgeCount = 3;

export function AdminTableSkeleton({
  columnTypes,
  rows = 8,
  minWidth = '980px',
  asBodyOnly = false,
  className = ''
}: AdminTableSkeletonProps) {
  const skeletonRows = (
    <>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <tr key={rowIndex} className="border-b border-slate-100">
          {columnTypes.map((type, columnIndex) => (
            <td key={`${rowIndex}-${columnIndex}`} className="px-4 py-4">
              <AdminTableSkeletonCell type={type} />
            </td>
          ))}
        </tr>
      ))}
    </>
  );

  if (asBodyOnly) {
    return skeletonRows;
  }

  return (
    <div className={`overflow-x-auto ${className}`.trim()}>
      <table className="w-full text-right text-sm" style={{ minWidth }}>
        <thead>
          <tr className="border-b border-slate-100">
            {columnTypes.map((_, index) => (
              <th key={index} className="px-4 py-3">
                <div className="h-3 w-16 animate-pulse rounded-full bg-slate-200" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{skeletonRows}</tbody>
      </table>
    </div>
  );
}

function AdminTableSkeletonCell({ type }: { type: AdminTableSkeletonColumnType }) {
  switch (type) {
    case 'avatar-text':
      return (
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 shrink-0 animate-pulse rounded-xl bg-slate-200" />
          <div className="min-w-0 space-y-2">
            <div className="h-4 w-32 animate-pulse rounded-full bg-slate-200" />
            <div className="h-3 w-40 animate-pulse rounded-full bg-slate-100" />
            <div className="h-3 w-24 animate-pulse rounded-full bg-slate-100" />
          </div>
        </div>
      );
    case 'badge':
      return <div className="h-6 w-20 animate-pulse rounded-full bg-slate-200" />;
    case 'badges':
      return (
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: defaultBadgeCount }).map((_, index) => (
            <div key={index} className="h-6 w-16 animate-pulse rounded-full bg-slate-200" />
          ))}
        </div>
      );
    case 'short':
      return <div className="h-4 w-8 animate-pulse rounded-full bg-slate-200" />;
    case 'actions':
      return (
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: defaultActionCount }).map((_, index) => (
            <div key={index} className="h-9 w-9 animate-pulse rounded-lg bg-slate-200" />
          ))}
        </div>
      );
    case 'text':
    default:
      return <div className="h-4 w-24 animate-pulse rounded-full bg-slate-200" />;
  }
}
