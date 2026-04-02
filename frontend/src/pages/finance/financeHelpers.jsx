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

// Merge two monthly arrays into one
export function mergeMonthly(a, b) {
  const map = {}
  ;[...(a || []), ...(b || [])].forEach(m => {
    if (!map[m.mois]) map[m.mois] = { mois: m.mois, prevu: 0, reel: 0, clientsPrevu: [], clientsReel: [] }
    map[m.mois].prevu += m.prevu
    map[m.mois].reel += m.reel
    map[m.mois].clientsPrevu.push(...m.clientsPrevu)
    map[m.mois].clientsReel.push(...m.clientsReel)
  })
  return Object.values(map).sort((a, b) => a.mois.localeCompare(b.mois))
}

// ── Cash Flow Chart — vertical bars, prévu vs réel, click popup ──
import { useState } from 'react'

const MOIS_SHORT = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc']

export function CashFlowChart({ monthlyData }) {
  const [popup, setPopup] = useState(null)

  if (!monthlyData || monthlyData.length === 0) return null

  // Filter 2026 months + group 2027
  const months2026 = []
  let sum2027prevu = 0, sum2027reel = 0, clients2027prevu = [], clients2027reel = []

  for (let m = 1; m <= 12; m++) {
    const key = `2026-${String(m).padStart(2, '0')}`
    const found = monthlyData.find(d => d.mois === key)
    months2026.push({
      label: MOIS_SHORT[m - 1],
      mois: key,
      prevu: found ? found.prevu : 0,
      reel: found ? found.reel : 0,
      clientsPrevu: found ? found.clientsPrevu : [],
      clientsReel: found ? found.clientsReel : [],
    })
  }

  monthlyData.forEach(d => {
    if (d.mois >= '2027') {
      sum2027prevu += d.prevu
      sum2027reel += d.reel
      d.clientsPrevu.forEach(c => clients2027prevu.push(c))
      d.clientsReel.forEach(c => clients2027reel.push(c))
    }
  })

  const allBars = [...months2026]
  if (sum2027prevu > 0 || sum2027reel > 0) {
    allBars.push({ label: '2027', mois: '2027', prevu: sum2027prevu, reel: sum2027reel, clientsPrevu: clients2027prevu, clientsReel: clients2027reel })
  }

  const maxVal = Math.max(...allBars.map(b => Math.max(b.prevu, b.reel)), 1)
  const barHeight = 160
  const totalPrevu = allBars.reduce((s, b) => s + b.prevu, 0)
  const totalReel = allBars.reduce((s, b) => s + b.reel, 0)

  return (
    <div style={{ width: '100%', maxWidth: 780, margin: '0 auto', position: 'relative' }}>
      {/* Title */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14 }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
          Encaissements 2026
        </div>
        <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>
          Réel: <span style={{ fontWeight: 700, color: '#00ab63' }}>{fmtMga(totalReel)}</span>
          <span style={{ margin: '0 6px', opacity: 0.3 }}>|</span>
          Prévu: <span style={{ fontWeight: 700, color: '#3498db' }}>{fmtMga(totalPrevu)}</span>
        </div>
      </div>

      {/* Vertical bars */}
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: barHeight, padding: '0 4px' }}>
        {allBars.map((bar, i) => {
          const prevuH = maxVal > 0 ? (bar.prevu / maxVal) * barHeight : 0
          const reelH = maxVal > 0 ? (bar.reel / maxVal) * barHeight : 0
          const hasData = bar.prevu > 0 || bar.reel > 0
          const is2027 = bar.mois === '2027'

          return (
            <div
              key={i}
              onClick={() => hasData ? setPopup(popup?.mois === bar.mois ? null : bar) : null}
              style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: hasData ? 'pointer' : 'default', position: 'relative' }}
            >
              {/* Value on top */}
              {hasData && (
                <div style={{ fontSize: 7, fontWeight: 700, color: bar.reel > 0 ? '#00ab63' : '#3498db', marginBottom: 2, whiteSpace: 'nowrap' }}>
                  {bar.reel > 0 ? fmtMga(bar.reel) : fmtMga(bar.prevu)}
                </div>
              )}
              {/* Stacked bar */}
              <div style={{ width: '100%', height: barHeight, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', alignItems: 'center', gap: 0 }}>
                {/* Prévu (full bar, lighter) */}
                <div style={{
                  width: '80%', height: Math.max(prevuH, hasData ? 2 : 0), borderRadius: '4px 4px 0 0',
                  background: is2027 ? '#9b59b644' : '#3498db33',
                  position: 'relative',
                  transition: 'height 0.4s ease',
                }}>
                  {/* Réel (overlay from bottom, solid) */}
                  {bar.reel > 0 && (
                    <div style={{
                      position: 'absolute', bottom: 0, left: 0, right: 0,
                      height: Math.min(reelH, prevuH || reelH),
                      background: '#00ab63',
                      borderRadius: prevuH <= reelH ? '4px 4px 0 0' : '0',
                      transition: 'height 0.4s ease',
                    }} />
                  )}
                </div>
                {/* If réel > prévu, show overflow */}
                {bar.reel > bar.prevu && bar.prevu > 0 && (
                  <div style={{
                    width: '80%', height: reelH - prevuH, background: '#00ab63',
                    borderRadius: '4px 4px 0 0', marginBottom: -1,
                    transition: 'height 0.4s ease',
                  }} />
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Month labels */}
      <div style={{ display: 'flex', gap: 2, padding: '4px 4px 0' }}>
        {allBars.map((bar, i) => (
          <div key={i} style={{ flex: 1, textAlign: 'center', fontSize: 8, fontWeight: (bar.prevu > 0 || bar.reel > 0) ? 700 : 400, color: (bar.prevu > 0 || bar.reel > 0) ? 'var(--text)' : 'var(--text-muted)', opacity: (bar.prevu > 0 || bar.reel > 0) ? 1 : 0.4 }}>
            {bar.label}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 14, justifyContent: 'center', marginTop: 10 }}>
        {[
          { color: '#3498db33', border: '#3498db', label: 'Prévu (échéances)' },
          { color: '#00ab63', label: 'Réel (encaissé)' },
        ].map((l, i) => (
          <span key={i} style={{ fontSize: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 12, height: 10, borderRadius: 2, background: l.color, border: l.border ? `1px solid ${l.border}` : 'none', display: 'inline-block' }} />
            <span style={{ color: 'var(--text-muted)' }}>{l.label}</span>
          </span>
        ))}
      </div>

      {/* Popup — client detail on bar click */}
      {popup && (
        <div
          style={{
            position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
            background: 'var(--card)', border: '1px solid var(--card-border)', borderRadius: 12,
            padding: '14px 18px', zIndex: 20, width: 'min(90%, 380px)',
            boxShadow: '0 16px 48px rgba(0,0,0,0.4)',
            maxHeight: 300, overflowY: 'auto',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text)' }}>{popup.mois}</span>
            <button onClick={() => setPopup(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 14 }}>x</button>
          </div>

          {/* Clients who paid */}
          {popup.clientsReel.length > 0 && (
            <>
              <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#00ab63', marginBottom: 4 }}>
                Encaissé ({popup.clientsReel.length})
              </div>
              {popup.clientsReel.map((c, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', borderBottom: '1px solid var(--card-border)' }}>
                  <span style={{ fontSize: 10, color: 'var(--text)' }}>{c.client}</span>
                  <span style={{ fontSize: 10, fontWeight: 700, color: '#00ab63' }}>{fmtMga(c.montant)}</span>
                </div>
              ))}
            </>
          )}

          {/* Clients expected but not paid */}
          {popup.clientsPrevu.length > 0 && (
            <>
              <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#3498db', marginTop: 8, marginBottom: 4 }}>
                Prévu — non encaissé ({popup.clientsPrevu.filter(c => !popup.clientsReel.find(r => r.client === c.client)).length})
              </div>
              {popup.clientsPrevu
                .filter(c => !popup.clientsReel.find(r => r.client === c.client))
                .map((c, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', borderBottom: '1px solid var(--card-border)' }}>
                  <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{c.client}</span>
                  <span style={{ fontSize: 10, fontWeight: 600, color: '#3498db' }}>{fmtMga(c.montant)}</span>
                </div>
              ))}
            </>
          )}
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
