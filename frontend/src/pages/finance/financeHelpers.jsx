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
  // Average delay in days (only clients with retard > 0)
  const retards = clients.map(c => c.retardJours).filter(r => r && r > 0)
  const avgRetard = retards.length > 0 ? Math.round(retards.reduce((a, b) => a + b, 0) / retards.length) : 0
  const maxRetard = retards.length > 0 ? Math.max(...retards) : 0
  const countRetard = retards.length

  return { totalCreances, encaissements, standby, contentieux, resteACollecter, planMars, planAvril, planMai, montant2025, montant2026, count: clients.length, avgRetard, maxRetard, countRetard }
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

// Nature KPI cards with percentage — replaces pie chart
import { useNavigate } from 'react-router-dom'

function buildSegments(entity, clients) {
  if (entity === 'filatex-sa') {
    const loyer = clients.filter(c => getFlxNature(c) === 'loyer')
    const penalite = clients.filter(c => getFlxNature(c) === 'penalite')
    const caution = clients.filter(c => getFlxNature(c) === 'caution')
    return [
      { filterKey: 'flx-loyer', label: 'Loyer', value: aggregate(loyer).totalCreances, count: loyer.length, color: '#3498db' },
      { filterKey: 'flx-penalite', label: 'Pénalité', value: aggregate(penalite).totalCreances, count: penalite.length, color: '#e67e22' },
      { filterKey: 'flx-caution', label: 'Caution', value: aggregate(caution).totalCreances, count: caution.length, color: '#9b59b6' },
    ]
  }
  const noteDebit = clients.filter(c => isTcmNoteDebit(c))
  const loyerVente = clients.filter(c => !isTcmNoteDebit(c))
  return [
    { filterKey: 'tcm-loyervente', label: 'Loyer + Vente', value: aggregate(loyerVente).totalCreances, count: loyerVente.length, color: '#3498db' },
    { filterKey: 'tcm-notedebit', label: 'Note de Débit', value: aggregate(noteDebit).totalCreances, count: noteDebit.length, color: '#e67e22' },
  ]
}

export function NatureDonut({ entity, clients, linkTo }) {
  const navigate = useNavigate()
  const total = clients.reduce((s, c) => s + (c.totalCreances || 0), 0)
  if (!total) return null
  const segments = buildSegments(entity, clients)

  const handleClick = (seg) => {
    if (linkTo) {
      const target = linkTo.includes('/groupe') || linkTo.includes('/hors-groupe')
        ? `${linkTo}?nature=${seg.filterKey}`
        : `${linkTo}/hors-groupe?nature=${seg.filterKey}`
      navigate(target)
    }
  }

  return (
    <div className="grid gap-2" style={{ width: '100%', gridTemplateColumns: `repeat(${segments.length}, 1fr)` }}>
      {segments.map((seg, i) => {
        const pct = total > 0 ? ((seg.value / total) * 100).toFixed(0) : 0
        return (
          <div
            key={i}
            className="s1-card"
            onClick={(e) => { e.stopPropagation(); handleClick(seg) }}
            style={{
              padding: 'clamp(8px, 1.2vw, 14px) clamp(6px, 1vw, 12px)',
              borderLeft: `3px solid ${seg.color}`,
              cursor: linkTo ? 'pointer' : 'default',
              transition: 'all 0.2s',
            }}
            onMouseEnter={linkTo ? (e) => { e.currentTarget.style.borderColor = seg.color; e.currentTarget.style.boxShadow = `0 0 16px ${seg.color}22`; e.currentTarget.style.transform = 'translateY(-2px)' } : undefined}
            onMouseLeave={linkTo ? (e) => { e.currentTarget.style.borderColor = ''; e.currentTarget.style.boxShadow = ''; e.currentTarget.style.transform = '' } : undefined}
          >
            <div className="s1-card-label" style={{ fontSize: 'clamp(6px, 0.7vw, 8px)', marginBottom: 'clamp(2px, 0.4vw, 4px)' }}>{seg.label}</div>
            <div className="s1-card-value" style={{ color: seg.color, fontSize: 'clamp(14px, 2vw, 22px)' }}>{fmtMga(seg.value)}</div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 3 }}>
              <span style={{ fontSize: 'clamp(11px, 1.4vw, 16px)', fontWeight: 800, color: seg.color, opacity: 0.7 }}>{pct}%</span>
              <span style={{ fontSize: 'clamp(7px, 0.8vw, 9px)', color: 'var(--text-muted)' }}>{seg.count} client{seg.count > 1 ? 's' : ''}</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── Cash Flow Chart — full year 2026 (Jan-Déc) + 2027 summary ──
const MOIS = ['Jan', 'Fév', 'Mars', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc']

export function CashFlowChart({ clients }) {
  const agg = aggregate(clients)
  const contentieux = agg.standby + agg.contentieux

  // Build 12 months for 2026 — only Mars/Avril/Mai have plan data
  const months = MOIS.map((label, i) => {
    let value = 0
    if (i === 0) value = 0        // Jan
    if (i === 1) value = agg.encaissements  // Fév — encaissements entre temps
    if (i === 2) value = agg.planMars       // Mars
    if (i === 3) value = agg.planAvril      // Avril
    if (i === 4) value = agg.planMai        // Mai
    // Jun-Déc: 0
    return { label, value, month: i }
  })

  // 2027 summary: reste non couvert par le plan
  const totalPlan = agg.encaissements + agg.planMars + agg.planAvril + agg.planMai + contentieux
  const reste2027 = Math.max(0, agg.totalCreances - totalPlan)

  const maxVal = Math.max(...months.map(m => m.value), reste2027 || 1, 1)
  const totalEstime = agg.encaissements + agg.planMars + agg.planAvril + agg.planMai

  function barColor(m) {
    if (m.month === 1) return '#00ab63' // Fév = encaissé
    if (m.value > 0) return '#3498db'   // Plan months
    return 'var(--card-border)'         // Empty months
  }

  return (
    <div style={{ width: '100%', maxWidth: 750, margin: '0 auto' }}>
      {/* Title */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
          Flux de rentrées estimé — 2026
        </div>
        <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>
          Total estimé: <span style={{ fontWeight: 700, color: COLOR }}>{fmtMga(totalEstime)}</span>
          <span style={{ opacity: 0.5, marginLeft: 6 }}>sur {fmtMga(agg.totalCreances)}</span>
        </div>
      </div>

      {/* 12-month bars */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {months.map((m, i) => {
          const pct = maxVal > 0 ? (m.value / maxVal) * 100 : 0
          const color = barColor(m)
          const hasValue = m.value > 0
          return (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 36, textAlign: 'right', fontSize: 9, fontWeight: hasValue ? 700 : 400, color: hasValue ? 'var(--text)' : 'var(--text-muted)', flexShrink: 0, opacity: hasValue ? 1 : 0.5 }}>
                {m.label}
              </div>
              <div style={{ flex: 1, height: 18, background: 'var(--card)', borderRadius: 4, overflow: 'hidden', border: '1px solid var(--card-border)' }}>
                <div style={{
                  width: `${Math.max(pct, hasValue ? 2 : 0)}%`,
                  height: '100%',
                  background: hasValue ? `linear-gradient(90deg, ${color}AA, ${color})` : 'transparent',
                  borderRadius: 4,
                  transition: 'width 0.6s ease',
                }} />
              </div>
              <div style={{ width: 65, fontSize: 9, fontWeight: 700, color: hasValue ? color : 'var(--text-muted)', textAlign: 'right', flexShrink: 0, opacity: hasValue ? 1 : 0.3 }}>
                {hasValue ? fmtMga(m.value) : '—'}
              </div>
            </div>
          )
        })}
      </div>

      {/* 2027 summary if any remainder */}
      {reste2027 > 0 && (
        <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 36, textAlign: 'right', fontSize: 9, fontWeight: 700, color: '#9b59b6', flexShrink: 0 }}>2027</div>
          <div style={{ flex: 1, height: 18, background: 'var(--card)', borderRadius: 4, overflow: 'hidden', border: '1px solid var(--card-border)' }}>
            <div style={{
              width: `${Math.max((reste2027 / maxVal) * 100, 2)}%`,
              height: '100%',
              background: 'linear-gradient(90deg, #9b59b6AA, #9b59b6)',
              borderRadius: 4,
              transition: 'width 0.6s ease',
            }} />
          </div>
          <div style={{ width: 65, fontSize: 9, fontWeight: 700, color: '#9b59b6', textAlign: 'right', flexShrink: 0 }}>
            {fmtMga(reste2027)}
          </div>
        </div>
      )}

      {/* Contentieux bar */}
      {contentieux > 0 && (
        <div style={{ marginTop: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 36, textAlign: 'right', fontSize: 8, color: '#e05c5c', flexShrink: 0, fontWeight: 600 }}>Cont.</div>
          <div style={{ flex: 1, height: 18, background: 'var(--card)', borderRadius: 4, overflow: 'hidden', border: '1px solid var(--card-border)' }}>
            <div style={{
              width: `${Math.max((contentieux / maxVal) * 100, 2)}%`,
              height: '100%',
              background: 'linear-gradient(90deg, #e05c5cAA, #e05c5c)',
              borderRadius: 4,
              transition: 'width 0.6s ease',
            }} />
          </div>
          <div style={{ width: 65, fontSize: 9, fontWeight: 700, color: '#e05c5c', textAlign: 'right', flexShrink: 0 }}>
            {fmtMga(contentieux)}
          </div>
        </div>
      )}

      {/* Cumulative progress bar */}
      {agg.totalCreances > 0 && (
        <div style={{ marginTop: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ fontSize: 8, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Progression recouvrement</span>
            <span style={{ fontSize: 9, fontWeight: 700, color: COLOR }}>
              {((totalEstime / agg.totalCreances) * 100).toFixed(0)}%
            </span>
          </div>
          <div style={{ height: 8, borderRadius: 4, background: 'var(--card-border)', overflow: 'hidden', display: 'flex' }}>
            <div style={{ width: `${(agg.encaissements / agg.totalCreances) * 100}%`, background: '#00ab63', transition: 'width 0.6s' }} />
            <div style={{ width: `${((agg.planMars + agg.planAvril + agg.planMai) / agg.totalCreances) * 100}%`, background: '#3498db', transition: 'width 0.6s' }} />
            {reste2027 > 0 && <div style={{ width: `${(reste2027 / agg.totalCreances) * 100}%`, background: '#9b59b6', transition: 'width 0.6s' }} />}
            {contentieux > 0 && <div style={{ width: `${(contentieux / agg.totalCreances) * 100}%`, background: '#e05c5c', transition: 'width 0.6s' }} />}
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 6, flexWrap: 'wrap' }}>
            {[
              { color: '#00ab63', label: 'Encaissé' },
              { color: '#3498db', label: 'Plan 2026' },
              ...(reste2027 > 0 ? [{ color: '#9b59b6', label: 'Report 2027' }] : []),
              ...(contentieux > 0 ? [{ color: '#e05c5c', label: 'Contentieux' }] : []),
            ].map((l, i) => (
              <span key={i} style={{ fontSize: 8, display: 'flex', alignItems: 'center', gap: 3 }}>
                <span style={{ width: 8, height: 8, borderRadius: 2, background: l.color, display: 'inline-block' }} />
                <span style={{ color: 'var(--text-muted)' }}>{l.label}</span>
              </span>
            ))}
          </div>
        </div>
      )}
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
