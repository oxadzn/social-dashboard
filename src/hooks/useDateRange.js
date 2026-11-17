import { useState } from 'react';
import { format, subDays } from 'date-fns';

const fmt = (d) => format(d, 'yyyy-MM-dd');

// Shared date-range state, stored as 'yyyy-MM-dd' strings so they work
// directly with <input type="date"> and as useEffect dependencies.
export default function useDateRange(defaultDays = 7) {
  const [range, setRange] = useState({
    start: fmt(subDays(new Date(), defaultDays - 1)),
    end: fmt(new Date()),
  });

  // TODO: add preset helpers (last 7 / 30 / 90 days) that call setRange
  return { range, setRange };
}
