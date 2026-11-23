import { useState } from 'react';
import { format, subDays } from 'date-fns';

const formatDate = (date) => format(date, 'yyyy-MM-dd');

export default function useDateRange(defaultDays = 7) {
  const [range, setRange] = useState(() => ({
    start: formatDate(subDays(new Date(), defaultDays - 1)),
    end: formatDate(new Date()),
  }));
  const [activePreset, setActivePreset] = useState(defaultDays);

  const setPreset = (days) => {
    setActivePreset(days);
    if (days) {
      const today = new Date();
      setRange({
        start: formatDate(subDays(today, days - 1)),
        end: formatDate(today),
      });
    }
  };

  return { range, setRange, setPreset, activePreset };
}
