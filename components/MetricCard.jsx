export default function MetricCard({ label, value, icon, change, color = "blue" }) {
  const trend =
    change == null ? null : change >= 0 ? (
      <span className="trend-up">▲ +{change}%</span>
    ) : (
      <span className="trend-down">▼ {change}%</span>
    );

  return (
    <div className={`metric-card ${color}`}>
      <div className="flex items-start justify-between gap-2">
        <span className="text-2xl leading-none" aria-hidden>
          {icon}
        </span>
        {trend}
      </div>
      <div>
        <p className="metric-value">{value}</p>
        <p className="metric-label mt-1">{label}</p>
      </div>
    </div>
  );
}
