export default function DateRangePicker({ range, onChange, onPreset, activePreset }) {
  const presets = [
    { label: '7D', days: 7 },
    { label: '30D', days: 30 },
    { label: '90D', days: 90 },
  ];

  return (
    <div className="range-control">
      <div className="range-presets" aria-label="Date range presets">
        {presets.map((preset) => (
          <button
            className={activePreset === preset.days ? 'is-active' : ''}
            key={preset.days}
            type="button"
            onClick={() => onPreset(preset.days)}
            aria-pressed={activePreset === preset.days}
          >
            {preset.label}
          </button>
        ))}
      </div>
      <div className="date-range">
        <label>
          <span>From</span>
          <input
            type="date"
            value={range.start}
            max={range.end}
            onChange={(event) => {
              onChange({ start: event.target.value, end: range.end });
              onPreset(null);
            }}
          />
        </label>
        <span className="date-range__divider" aria-hidden="true">–</span>
        <label>
          <span>To</span>
          <input
            type="date"
            value={range.end}
            min={range.start}
            onChange={(event) => {
              onChange({ start: range.start, end: event.target.value });
              onPreset(null);
            }}
          />
        </label>
      </div>
    </div>
  );
}
