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

// ── Nature classification ──
// TCM: Note de Débit vs Loyer+Vente (based on souche field)
// FLX: Loyer vs Pénalité vs Caution (based on observations)

// Nature classifiers (exported for filter use)
export function isTcmNoteDebit(c) {
  const s = (c.souche || '').toLowerCase()
  return s.includes('notede') || s.includes('notedé')
}

export function getFlxNature(c) {
  const obs = (c.observations || '').toUpperCase()
  if (obs.includes('NOTE DE DEBIT')) return 'penalite'
  if (obs.includes('FONCIER')) return 'caution'
  return 'loyer'
}

// Nature filter card renderer (shared between FLX and TCM)
function NatureFilterCard({ it, isActive, hasFilter, onClick }) {
  return (
    <div
      className="s1-card"
      onClick={onClick}
      style={{
        padding: 'clamp(8px, 1.2vw, 14px) clamp(6px, 1vw, 12px)',
        borderLeft: `3px solid ${it.color}`,
        cursor: 'pointer',
        transition: 'all 0.25s ease',
        borderColor: isActive ? it.color : undefined,
        boxShadow: isActive ? `0 0 20px ${it.color}33, inset 0 0 12px ${it.color}11` : undefined,
        background: isActive ? `${it.color}0A` : undefined,
        transform: isActive ? 'scale(1.03)' : undefined,
        opacity: hasFilter && !isActive ? 0.45 : 1,
      }}
    >
      <div className="s1-card-label" style={{ fontSize: 'clamp(6px, 0.7vw, 8px)', marginBottom: 'clamp(3px, 0.5vw, 6px)' }}>{it.label}</div>
      <div className="s1-card-value" style={{ color: it.color, fontSize: 'clamp(15px, 2.2vw, 24px)' }}>{fmtMga(it.total)}</div>
      <div style={{ fontSize: 'clamp(7px, 0.8vw, 9px)', color: 'var(--text-muted)', marginTop: 2 }}>{it.count} client{it.count > 1 ? 's' : ''}</div>
    </div>
  )
}

// TCM Nature KPI — 2 cards: Note de Débit | Loyer+Vente (filterable)
export function TcmNatureKpiCards({ clients, active, onSelect }) {
  const noteDebit = clients.filter(c => isTcmNoteDebit(c))
  const loyerVente = clients.filter(c => !isTcmNoteDebit(c))
  const items = [
    { key: 'tcm-notedebit', label: 'Note de Débit', total: aggregate(noteDebit).totalCreances, count: noteDebit.length, color: '#e67e22' },
    { key: 'tcm-loyervente', label: 'Loyer + Vente', total: aggregate(loyerVente).totalCreances, count: loyerVente.length, color: '#3498db' },
  ]
  const isFilterable = !!onSelect
  return (
    <div className="grid gap-2 mb-3" style={{ width: '100%', maxWidth: 700, gridTemplateColumns: 'repeat(2, 1fr)' }}>
      {items.map((it) => (
        <NatureFilterCard
          key={it.key} it={it}
          isActive={active === it.key}
          hasFilter={!!active}
          onClick={isFilterable ? () => onSelect(active === it.key ? null : it.key) : undefined}
        />
      ))}
    </div>
  )
}

// FLX Nature KPI — 3 cards: Loyer | Pénalité | Caution (filterable)
export function FlxNatureKpiCards({ clients, active, onSelect }) {
  const loyer = clients.filter(c => getFlxNature(c) === 'loyer')
  const penalite = clients.filter(c => getFlxNature(c) === 'penalite')
  const caution = clients.filter(c => getFlxNature(c) === 'caution')
  const items = [
    { key: 'flx-loyer', label: 'Loyer', total: aggregate(loyer).totalCreances, count: loyer.length, color: '#3498db' },
    { key: 'flx-penalite', label: 'Pénalité', total: aggregate(penalite).totalCreances, count: penalite.length, color: '#e67e22' },
    { key: 'flx-caution', label: 'Caution', total: aggregate(caution).totalCreances, count: caution.length, color: '#9b59b6' },
  ]
  const isFilterable = !!onSelect
  return (
    <div className="grid gap-2 mb-3" style={{ width: '100%', maxWidth: 700, gridTemplateColumns: 'repeat(3, 1fr)' }}>
      {items.map((it) => (
        <NatureFilterCard
          key={it.key} it={it}
          isActive={active === it.key}
          hasFilter={!!active}
          onClick={isFilterable ? () => onSelect(active === it.key ? null : it.key) : undefined}
        />
      ))}
    </div>
  )
}

// Nature filter predicates (used in FinanceClientList)
export const NATURE_FILTERS = {
  'tcm-notedebit': (c) => isTcmNoteDebit(c),
  'tcm-loyervente': (c) => !isTcmNoteDebit(c),
  'flx-loyer': (c) => getFlxNature(c) === 'loyer',
  'flx-penalite': (c) => getFlxNature(c) === 'penalite',
  'flx-caution': (c) => getFlxNature(c) === 'caution',
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
