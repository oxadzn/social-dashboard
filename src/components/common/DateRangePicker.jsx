// Controlled date inputs. Props: range = { start, end }, onChange(newRange)
// TODO: validate that start <= end; add preset buttons (7d / 30d / 90d)
export default function DateRangePicker({ range, onChange }) {
  return (
    <div className="date-range">
      <label>
        From
        <input type="date" value={range.start} max={range.end}
          onChange={(e) => onChange({ ...range, start: e.target.value })} />
      </label>
      <label>
        To
        <input type="date" value={range.end} min={range.start}
          onChange={(e) => onChange({ ...range, end: e.target.value })} />
      </label>
    </div>
  );
}
