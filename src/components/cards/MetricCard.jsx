// Reusable KPI card. Props: label, value, change (percent, +/-)
export default function MetricCard({ label, value, change }) {
  const up = change >= 0;
  return (
    <div className="card metric">
      <span className="metric__label">{label}</span>
      <strong className="metric__value">{Number(value ?? 0).toLocaleString()}</strong>
      <span className={`metric__change ${up ? 'up' : 'down'}`}>
        {up ? '▲' : '▼'} {Math.abs(change)}%
      </span>
    </div>
  );
}
