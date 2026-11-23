export default function MetricCard({ id, label, value, change, suffix }) {
  const isPositive = Number(change) >= 0;
  const displayValue = suffix === '%'
    ? `${Number(value ?? 0).toLocaleString()}${suffix}`
    : Number(value ?? 0).toLocaleString();

  return (
    <article className="metric-card">
      <div className="metric-card__topline">
        <span className="metric-card__label">{label}</span>
      </div>
      <strong className="metric-card__value">{displayValue}</strong>
      <div className="metric-card__foot">
        <span
          className={`change-pill ${isPositive ? 'change-pill--up' : 'change-pill--down'}`}
          aria-label={`${isPositive ? 'Up' : 'Down'} ${Math.abs(Number(change) || 0)}% from previous period`}
        >
          {isPositive ? '+' : '−'}{Math.abs(Number(change) || 0)}%
        </span>
      </div>
    </article>
  );
}
