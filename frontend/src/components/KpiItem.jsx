export default function KpiItem({ value, label, color }) {
  return (
    <div className="text-center px-3">
      <div className="text-xl font-bold" style={{ color }}>{value}</div>
      <div className="text-[10px] text-[var(--text-muted)]">{label}</div>
    </div>
  )
}
