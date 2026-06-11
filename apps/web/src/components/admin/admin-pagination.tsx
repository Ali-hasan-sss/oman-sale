type AdminPaginationProps = {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  labels: {
    previous: string;
    next: string;
    page: string;
    of: string;
  };
};

export function getPaginationRange(current: number, total: number, maxVisible = 4): (number | 'ellipsis')[] {
  if (total <= maxVisible) {
    return Array.from({ length: total }, (_, index) => index + 1);
  }

  let start = Math.max(1, Math.min(current - 1, total - maxVisible + 1));
  const end = Math.min(total, start + maxVisible - 1);
  start = Math.max(1, end - maxVisible + 1);

  const items: (number | 'ellipsis')[] = [];

  if (start > 1) {
    items.push(1);
    if (start > 2) items.push('ellipsis');
  }

  for (let pageNumber = start; pageNumber <= end; pageNumber += 1) {
    items.push(pageNumber);
  }

  if (end < total) {
    if (end < total - 1) items.push('ellipsis');
    items.push(total);
  }

  return items;
}

export function AdminPagination({ page, totalPages, onPageChange, labels }: AdminPaginationProps) {
  const items = getPaginationRange(page, totalPages, 4);

  return (
    <div className="flex flex-col gap-3 border-t border-slate-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm font-bold text-slate-500">
        {labels.page} {page} {labels.of} {totalPages}
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold disabled:opacity-50"
        >
          {labels.previous}
        </button>
        {items.map((item, index) =>
          item === 'ellipsis' ? (
            <span key={`ellipsis-${index}`} className="px-1 text-sm font-bold text-slate-400">
              ...
            </span>
          ) : (
            <button
              key={item}
              type="button"
              onClick={() => onPageChange(item)}
              className={`min-w-10 rounded-xl border px-3 py-2 text-sm font-bold transition ${
                item === page
                  ? 'border-brand-600 bg-brand-600 text-white'
                  : 'border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              {item}
            </button>
          )
        )}
        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold disabled:opacity-50"
        >
          {labels.next}
        </button>
      </div>
    </div>
  );
}
