import { isWithinInterval, parseISO } from 'date-fns';

// Keep rows whose `key` field falls inside the selected range (inclusive).
export function filterByRange(rows, key, range) {
  if (!rows || !range?.start || !range?.end) return [];
  const start = parseISO(range.start);
  const end = parseISO(range.end);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return [];
  const interval = { start, end };
  return rows.filter((row) => isWithinInterval(parseISO(row[key]), interval));
}
