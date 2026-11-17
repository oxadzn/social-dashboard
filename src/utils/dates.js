import { isWithinInterval, parseISO } from 'date-fns';

// Keep rows whose `key` field falls inside the selected range (inclusive).
export function filterByRange(rows, key, range) {
  if (!rows) return [];
  const interval = { start: parseISO(range.start), end: parseISO(range.end) };
  return rows.filter((row) => isWithinInterval(parseISO(row[key]), interval));
}
