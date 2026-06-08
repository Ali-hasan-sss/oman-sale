const TREND_DAYS = 30;

export function getTrendSinceDate() {
  const since = new Date();
  since.setHours(0, 0, 0, 0);
  since.setDate(since.getDate() - (TREND_DAYS - 1));
  return since;
}

export function buildDateLabels(days = TREND_DAYS) {
  const since = getTrendSinceDate();
  const labels: string[] = [];

  for (let i = 0; i < days; i++) {
    const date = new Date(since);
    date.setDate(since.getDate() + i);
    labels.push(date.toISOString().slice(0, 10));
  }

  return labels;
}

export function buildTrendSeries(
  rows: Array<{ day: Date; value: number }>,
  days = TREND_DAYS
) {
  const labels = buildDateLabels(days);
  const map = new Map<string, number>();

  for (const row of rows) {
    const key = row.day.toISOString().slice(0, 10);
    map.set(key, row.value);
  }

  return {
    labels,
    values: labels.map((label) => map.get(label) ?? 0)
  };
}

export function toNumber(value: unknown) {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'number') return value;
  if (typeof value === 'bigint') return Number(value);
  if (typeof value === 'object' && value !== null && 'toNumber' in value && typeof value.toNumber === 'function') {
    return value.toNumber();
  }
  return Number(value);
}
