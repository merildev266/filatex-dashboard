export default function KpiBox({ value, label, color, size = 'md' }) {
  const sizes = {
    sm: { value: 'text-lg', label: 'text-[9px]' },
    md: { value: 'text-2xl', label: 'text-[10px]' },
    lg: { value: 'text-3xl', label: 'text-xs' },
  }
  const s = sizes[size] || sizes.md

  return (
    <div className="text-center">
      <div className={`${s.value} font-bold`} style={{ color }}>
        {value ?? '—'}
      </div>
      <div className={`${s.label} text-[var(--text-muted)] uppercase tracking-wider mt-1`}>
        {label}
      </div>
    </div>
  )
}
