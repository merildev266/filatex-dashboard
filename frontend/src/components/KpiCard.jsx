const SIZES = {
  xs: { value: 'clamp(13px, 1.8vw, 18px)', label: 'clamp(6px, 0.65vw, 8px)', sub: 'clamp(6px, 0.6vw, 7px)' },
  sm: { value: 'clamp(15px, 2.2vw, 24px)', label: 'clamp(6px, 0.7vw, 8px)', sub: 'clamp(7px, 0.8vw, 9px)' },
  md: { value: 'clamp(18px, 2.5vw, 28px)', label: 'clamp(7px, 0.8vw, 9px)', sub: 'clamp(7px, 0.8vw, 9px)' },
}

export default function KpiCard({ value, label, color, subText, unit, unitPosition = 'inline', size = 'md', style = {} }) {
  const s = SIZES[size] || SIZES.md

  return (
    <div className="s1-card" style={{ padding: 'clamp(10px, 1.4vw, 16px) clamp(8px, 1.2vw, 14px)', ...style }}>
      <div style={{ fontSize: s.label, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 'clamp(3px, 0.5vw, 6px)' }}>
        {label}
      </div>
      <div style={{ fontSize: s.value, fontWeight: 400, color: color || 'var(--text)' }}>
        {value ?? '—'}
        {unit && unitPosition === 'inline' && (
          <span style={{ fontSize: s.sub, color: 'var(--text-muted)', marginLeft: 4, fontWeight: 400 }}>{unit}</span>
        )}
      </div>
      {unit && unitPosition === 'below' && (
        <div style={{ fontSize: s.sub, color: 'var(--text-muted)', marginTop: 2 }}>{unit}</div>
      )}
      {subText && (
        <div style={{ fontSize: s.sub, color: 'var(--text-muted)', marginTop: 2 }}>{subText}</div>
      )}
    </div>
  )
}
