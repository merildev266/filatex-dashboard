// Finance helpers — shared formatting & aggregation utilities
export const COLOR = '#1abc9c'

export function fmtMga(v) {
  if (!v) return '—'
  const abs = Math.abs(v)
  if (abs >= 1e9) return `${(v / 1e9).toFixed(2)} Mds`
  if (abs >= 1e6) return `${(v / 1e6).toFixed(1)} M`
  if (abs >= 1e3) return `${(v / 1e3).toFixed(0)} K`
  return v.toLocaleString('fr-FR')
}

export function aggregate(clients) {
  let totalCreances = 0, encaissements = 0, standby = 0, contentieux = 0
  let resteACollecter = 0, planMars = 0, planAvril = 0, planMai = 0
  let montant2025 = 0, montant2026 = 0
  clients.forEach(c => {
    totalCreances += c.totalCreances || 0
    encaissements += c.encaissements || 0
    standby += c.standby || 0
    contentieux += c.contentieux || 0
    resteACollecter += c.resteACollecter || 0
    planMars += c.planMars || 0
    planAvril += c.planAvril || 0
    planMai += c.planMai || 0
    montant2025 += c.montant2025 || 0
    montant2026 += c.montant2026 || 0
  })
  return { totalCreances, encaissements, standby, contentieux, resteACollecter, planMars, planAvril, planMai, montant2025, montant2026, count: clients.length }
}

// Compact s1-card style KPI cards (static, no filter)
export function KpiCards({ items }) {
  return (
    <div className="grid gap-2 mb-3" style={{ width: '100%', maxWidth: 700, gridTemplateColumns: `repeat(${items.length}, 1fr)` }}>
      {items.map((kpi, i) => (
        <div className="s1-card" key={i} style={{ padding: 'clamp(8px, 1.2vw, 14px) clamp(6px, 1vw, 12px)' }}>
          <div className="s1-card-label" style={{ fontSize: 'clamp(6px, 0.7vw, 8px)', marginBottom: 'clamp(3px, 0.5vw, 6px)' }}>{kpi.label}</div>
          <div className="s1-card-value" style={{ color: kpi.color || 'var(--text)', fontSize: 'clamp(15px, 2.2vw, 24px)' }}>{kpi.value}</div>
          {kpi.unit && <div className="s1-card-unit-line" style={{ fontSize: 'clamp(8px, 0.9vw, 11px)' }}>{kpi.unit}</div>}
        </div>
      ))}
    </div>
  )
}

// Clickable KPI filter cards
export function KpiFilterCards({ items, active, onSelect }) {
  return (
    <div className="grid gap-2 mb-3" style={{ width: '100%', maxWidth: 700, gridTemplateColumns: `repeat(${items.length}, 1fr)` }}>
      {items.map((kpi, i) => {
        const isActive = active === kpi.filterKey
        return (
          <div
            className="s1-card"
            key={i}
            onClick={(e) => { e.stopPropagation(); onSelect(isActive ? null : kpi.filterKey) }}
            style={{
              padding: 'clamp(8px, 1.2vw, 14px) clamp(6px, 1vw, 12px)',
              cursor: 'pointer',
              transition: 'all 0.25s ease',
              borderColor: isActive ? (kpi.color || COLOR) : undefined,
              boxShadow: isActive ? `0 0 20px ${kpi.color || COLOR}33, inset 0 0 12px ${kpi.color || COLOR}11` : undefined,
              background: isActive ? `${kpi.color || COLOR}0A` : undefined,
              transform: isActive ? 'scale(1.03)' : undefined,
              opacity: active && !isActive ? 0.45 : 1,
            }}
          >
            <div className="s1-card-label" style={{ fontSize: 'clamp(6px, 0.7vw, 8px)', marginBottom: 'clamp(3px, 0.5vw, 6px)' }}>{kpi.label}</div>
            <div className="s1-card-value" style={{ color: kpi.color || 'var(--text)', fontSize: 'clamp(15px, 2.2vw, 24px)' }}>{kpi.value}</div>
            {kpi.count !== undefined && (
              <div style={{ fontSize: 'clamp(7px, 0.8vw, 9px)', color: 'var(--text-muted)', marginTop: 2 }}>{kpi.count} client{kpi.count > 1 ? 's' : ''}</div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// Client count badge
export function ClientCount({ count, label }) {
  return (
    <div style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.08em', marginBottom: 4 }}>
      <span style={{ fontWeight: 700, color: COLOR, fontSize: 14 }}>{count}</span>{' '}
      <span style={{ textTransform: 'uppercase', letterSpacing: '0.15em', fontSize: 9 }}>{label || (count > 1 ? 'clients' : 'client')}</span>
    </div>
  )
}
