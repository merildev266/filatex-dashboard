import { useState, useMemo, useEffect, useRef } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { FLX_CLIENTS, TCM_CLIENTS, FLX_MONTHLY, TCM_MONTHLY, TCM_PROJECTS } from '../../data/finance_data'
import { COLOR, fmtMga, aggregate, KpiCards, KpiFilterCards, FlxNatureKpiCards, TcmNatureKpiCards, NATURE_FILTERS, CashFlowChart, ClientCount } from './financeHelpers.jsx'

const ENTITY_CFG = {
  'filatex-sa': { label: 'Filatex SA', data: FLX_CLIENTS, monthly: FLX_MONTHLY },
  'tcm': { label: 'TCM', data: TCM_CLIENTS, monthly: TCM_MONTHLY },
}

// KPI filter definitions
const FILTERS = {
  all:         () => true,
  encaisse:    (c) => (c.encaissements || 0) > 0,
  contentieux: (c) => (c.standby || 0) > 0 || (c.contentieux || 0) > 0,
  reste:       (c) => (c.resteACollecter || 0) > 0,
}

// Year filter: keep clients that have amounts in that year
const YEAR_FILTERS = {
  all:  () => true,
  '2025': (c) => (c.montant2025 || 0) > 0,
  '2026': (c) => (c.montant2026 || 0) > 0,
}

function DetailRow({ label, value, color }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid var(--card-border)' }}>
      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{label}</span>
      <span style={{ fontSize: 12, fontWeight: 600, color: color || 'var(--text)' }}>{value}</span>
    </div>
  )
}

function ClientCard({ client, isFlx }) {
  const [open, setOpen] = useState(false)
  const c = client

  return (
    <div
      className="card card-finance"
      style={{ padding: '20px 18px', cursor: 'pointer', alignItems: 'stretch', textAlign: 'left' }}
      onClick={() => setOpen(!open)}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', lineHeight: 1.2 }}>{c.client}</span>
            <div style={{ display: 'flex', gap: 3 }}>
              {(c.montant2025 || 0) > 0 && (
                <span style={{ fontSize: 7, padding: '1px 5px', borderRadius: 4, background: 'rgba(52,152,219,0.15)', color: '#3498db', fontWeight: 700, letterSpacing: '0.02em' }}>2025</span>
              )}
              {(c.montant2026 || 0) > 0 && (
                <span style={{ fontSize: 7, padding: '1px 5px', borderRadius: 4, background: 'rgba(26,188,156,0.15)', color: COLOR, fontWeight: 700, letterSpacing: '0.02em' }}>2026</span>
              )}
            </div>
          </div>
          {isFlx && c.code && <div style={{ fontSize: 9, color: 'var(--text-muted)', letterSpacing: '0.08em' }}>{c.code}</div>}
          {/* Date facturation + retard */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2, flexWrap: 'wrap' }}>
            {c.dateFacture && (
              <span style={{ fontSize: 8, color: 'var(--text-muted)' }}>
                Fact. {new Date(c.dateFacture).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
              </span>
            )}
            {c.echeance && (
              <span style={{ fontSize: 8, color: 'var(--text-muted)' }}>
                Éch. {new Date(c.echeance).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
              </span>
            )}
            {c.retardJours > 0 && (
              <span style={{
                fontSize: 7, padding: '1px 6px', borderRadius: 4, fontWeight: 700,
                background: c.retardJours > 180 ? 'rgba(224,92,92,0.2)' : c.retardJours > 90 ? 'rgba(243,112,86,0.15)' : 'rgba(243,156,18,0.15)',
                color: c.retardJours > 180 ? '#e05c5c' : c.retardJours > 90 ? '#f37056' : '#f39c12',
              }}>
                {c.retardJours}j retard
              </span>
            )}
          </div>
        </div>
        <svg viewBox="0 0 20 20" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" style={{ width: 16, height: 16, flexShrink: 0, transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
          <polyline points="5 8 10 13 15 8" />
        </svg>
      </div>

      {/* Mini KPI cards */}
      <div className="grid grid-cols-3 gap-1.5 w-full">
        <div className="s1-card" style={{ padding: '8px 4px' }}>
          <div className="s1-card-label" style={{ fontSize: 'clamp(5px, 0.6vw, 7px)' }}>Créances</div>
          <div className="s1-card-value" style={{ color: COLOR, fontSize: 'clamp(11px, 1.4vw, 15px)' }}>{fmtMga(c.totalCreances)}</div>
        </div>
        <div className="s1-card" style={{ padding: '8px 4px' }}>
          <div className="s1-card-label" style={{ fontSize: 'clamp(5px, 0.6vw, 7px)' }}>Encaissé</div>
          <div className="s1-card-value" style={{ color: '#00ab63', fontSize: 'clamp(11px, 1.4vw, 15px)' }}>{fmtMga(c.encaissements)}</div>
        </div>
        <div className="s1-card" style={{ padding: '8px 4px' }}>
          <div className="s1-card-label" style={{ fontSize: 'clamp(5px, 0.6vw, 7px)' }}>Reste</div>
          <div className="s1-card-value" style={{ color: '#f39c12', fontSize: 'clamp(11px, 1.4vw, 15px)' }}>{fmtMga(c.resteACollecter)}</div>
        </div>
      </div>

      {/* Status badge */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
        {c.observations && (
          <span style={{
            fontSize: 8, padding: '2px 8px', borderRadius: 6, letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 600,
            background: c.observations.includes('JURIDIQUE') ? 'rgba(224,92,92,0.15)' : c.observations.includes('PAYE') ? 'rgba(0,171,99,0.12)' : c.observations.includes('IRRECOUVRABLE') ? 'rgba(224,92,92,0.25)' : 'rgba(26,188,156,0.12)',
            color: c.observations.includes('JURIDIQUE') ? '#e05c5c' : c.observations.includes('PAYE') ? '#00ab63' : c.observations.includes('IRRECOUVRABLE') ? '#e05c5c' : COLOR,
          }}>
            {c.observations.length > 30 ? c.observations.slice(0, 28) + '…' : c.observations}
          </span>
        )}
        {c.acteur && (
          <span style={{ fontSize: 8, padding: '2px 8px', borderRadius: 6, background: 'rgba(66,106,179,0.12)', color: '#426ab3', fontWeight: 600 }}>
            {c.acteur}
          </span>
        )}
      </div>

      {/* Detail panel */}
      {open && (
        <div style={{ marginTop: 14, padding: '12px 0 0', borderTop: `1px solid ${COLOR}33` }}>
          <DetailRow label="Montant 2025" value={fmtMga(c.montant2025)} />
          <DetailRow label="Montant 2026" value={fmtMga(c.montant2026)} />
          <DetailRow label="Total Créances" value={fmtMga(c.totalCreances)} color={COLOR} />
          <DetailRow label="Encaissements" value={fmtMga(c.encaissements)} color="#00ab63" />
          {isFlx && <DetailRow label="Stand by / Contentieux" value={fmtMga(c.standby)} color="#e05c5c" />}
          {!isFlx && <DetailRow label="Contentieux / Irrécouvrables" value={fmtMga(c.contentieux)} color="#e05c5c" />}
          <DetailRow label="Reste à collecter" value={fmtMga(c.resteACollecter)} color="#f39c12" />
          <div style={{ height: 8 }} />
          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 6 }}>Plan d'appurement</div>
          <DetailRow label="Mars 2026" value={fmtMga(c.planMars)} />
          <DetailRow label="Avril 2026" value={fmtMga(c.planAvril)} />
          <DetailRow label="Mai 2026" value={fmtMga(c.planMai)} />
          {!isFlx && c.souche && (
            <>
              <div style={{ height: 8 }} />
              <DetailRow label="Souche" value={c.souche} />
              {c.projet && <DetailRow label="Projet" value={c.projet} />}
            </>
          )}
        </div>
      )}
    </div>
  )
}

/* ── Tab bar Groupe / Hors Groupe ── */
function CategoryTabs({ entity, active }) {
  const navigate = useNavigate()
  const tabs = [
    { key: 'groupe', label: 'Groupe', path: `/finance/${entity}/groupe` },
    { key: 'hors-groupe', label: 'Hors Groupe', path: `/finance/${entity}/hors-groupe` },
  ]
  return (
    <div style={{ display: 'flex', gap: 0, borderRadius: 10, overflow: 'hidden', border: `1px solid ${COLOR}33` }}>
      {tabs.map(tab => {
        const isActive = active === tab.key
        return (
          <button
            key={tab.key}
            onClick={() => navigate(tab.path)}
            style={{
              padding: '7px 20px', fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase',
              cursor: 'pointer', border: 'none', transition: 'all 0.2s',
              background: isActive ? COLOR : 'transparent',
              color: isActive ? '#fff' : 'var(--text-muted)',
            }}
          >
            {tab.label}
          </button>
        )
      })}
    </div>
  )
}

/* ── Year filter pills ── */
function YearFilter({ active, onChange, counts }) {
  const options = [
    { key: 'all', label: 'Tous', count: counts.all },
    { key: '2025', label: '2025', count: counts['2025'] },
    { key: '2026', label: '2026', count: counts['2026'] },
  ]
  return (
    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
      <span style={{ fontSize: 8, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--text-muted)', marginRight: 4 }}>Année</span>
      {options.map(opt => {
        const isActive = active === opt.key
        return (
          <button
            key={opt.key}
            onClick={() => onChange(isActive && opt.key !== 'all' ? 'all' : opt.key)}
            style={{
              padding: '4px 12px', fontSize: 9, fontWeight: 600, letterSpacing: '0.06em',
              borderRadius: 8, cursor: 'pointer', transition: 'all 0.2s',
              border: `1px solid ${isActive ? COLOR : 'var(--card-border)'}`,
              background: isActive ? `${COLOR}18` : 'transparent',
              color: isActive ? COLOR : 'var(--text-muted)',
            }}
          >
            {opt.label} <span style={{ fontSize: 8, opacity: 0.7 }}>({opt.count})</span>
          </button>
        )
      })}
    </div>
  )
}

/* ── Sort controls ── */
function SortControls({ active, onChange }) {
  const options = [
    { key: 'montant-desc', label: 'Montant ↓' },
    { key: 'montant-asc', label: 'Montant ↑' },
    { key: 'date-desc', label: 'Date ↓' },
    { key: 'date-asc', label: 'Date ↑' },
  ]
  return (
    <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
      <span style={{ fontSize: 8, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--text-muted)', marginRight: 4 }}>Tri</span>
      {options.map(opt => {
        const isActive = active === opt.key
        return (
          <button
            key={opt.key}
            onClick={() => onChange(opt.key)}
            style={{
              padding: '4px 10px', fontSize: 9, fontWeight: 600,
              borderRadius: 8, cursor: 'pointer', transition: 'all 0.2s',
              border: `1px solid ${isActive ? COLOR : 'var(--card-border)'}`,
              background: isActive ? `${COLOR}18` : 'transparent',
              color: isActive ? COLOR : 'var(--text-muted)',
            }}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}

/* ── View toggle: Client / Projet (TCM only) ── */
function ViewToggle({ active, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 0, borderRadius: 10, overflow: 'hidden', border: `1px solid ${COLOR}33` }}>
      {[
        { key: 'client', label: 'Clients' },
        { key: 'projet', label: 'Projets' },
      ].map(tab => {
        const isActive = active === tab.key
        return (
          <button
            key={tab.key}
            onClick={() => onChange(tab.key)}
            style={{
              padding: '7px 18px', fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase',
              cursor: 'pointer', border: 'none', transition: 'all 0.2s',
              background: isActive ? '#9b59b6' : 'transparent',
              color: isActive ? '#fff' : 'var(--text-muted)',
            }}
          >
            {tab.label}
          </button>
        )
      })}
    </div>
  )
}

/* ── Project card with expandable sub-projects ── */
function ProjectCard({ project, onClick }) {
  const p = project
  const pct = p.totalCreances > 0 ? ((p.encaissements / p.totalCreances) * 100).toFixed(0) : 0

  return (
    <div
      className="card card-finance"
      style={{ padding: '20px 18px', cursor: 'pointer', alignItems: 'stretch', textAlign: 'left' }}
      onClick={onClick}
    >
      {/* Header */}
      <div style={{ marginBottom: 8 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', lineHeight: 1.2 }}>{p.projet}</div>
        <div style={{ fontSize: 8, color: 'var(--text-muted)', marginTop: 2 }}>
          {p.nbClients} client{p.nbClients > 1 ? 's' : ''}
          {p.isGroup && ` · ${p.sousProjectes.length} sous-projets`}
        </div>
      </div>

      {/* Mini KPI cards */}
      <div className="grid grid-cols-3 gap-1.5 w-full">
        {[
          { label: 'Créances', value: fmtMga(p.totalCreances), color: COLOR },
          { label: 'Encaissé', value: fmtMga(p.encaissements), color: '#00ab63' },
          { label: 'Reste', value: fmtMga(p.resteACollecter), color: '#f39c12' },
        ].map((k, i) => (
          <div key={i} className="s1-card" style={{ padding: '8px 4px' }}>
            <div className="s1-card-label" style={{ fontSize: 'clamp(5px, 0.6vw, 7px)' }}>{k.label}</div>
            <div className="s1-card-value" style={{ color: k.color, fontSize: 'clamp(11px, 1.4vw, 15px)' }}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* % + progress bar BELOW KPIs */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8, width: '100%' }}>
        <div style={{ flex: 1, height: 5, borderRadius: 3, background: 'var(--card-border)', overflow: 'hidden' }}>
          <div style={{ width: `${pct}%`, height: '100%', background: '#00ab63', borderRadius: 3 }} />
        </div>
        <span style={{ fontSize: 12, fontWeight: 800, color: Number(pct) >= 50 ? '#00ab63' : '#f39c12', flexShrink: 0 }}>{pct}%</span>
      </div>
    </div>
  )
}

export default function FinanceClientList() {
  const { entity, category } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const [kpiFilter, setKpiFilter] = useState(null)
  const [yearFilter, setYearFilter] = useState('all')
  const [natureFilter, setNatureFilter] = useState(null)
  const [sortMode, setSortMode] = useState('montant-desc')
  const [viewMode, setViewMode] = useState('client') // 'client' | 'projet'
  const lastKey = useRef('')

  // Reset filters on navigation + read ?nature= from camembert
  useEffect(() => {
    // Only run when the route actually changes (not after URL cleanup)
    const routeKey = `${entity}/${category}`
    const params = new URLSearchParams(location.search)
    const natureParam = params.get('nature')

    if (routeKey !== lastKey.current || natureParam) {
      lastKey.current = routeKey
      setKpiFilter(null)
      setYearFilter('all')
      setSortMode('montant-desc')
      setViewMode('client')
      if (natureParam && NATURE_FILTERS[natureParam]) {
        setNatureFilter(natureParam)
        window.history.replaceState(null, '', location.pathname)
      } else {
        setNatureFilter(null)
      }
    }
  }, [entity, category, location.search])

  const cfg = ENTITY_CFG[entity]
  if (!cfg) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Entité inconnue</div>

  const isGroupe = category === 'groupe'
  const isFlx = entity === 'filatex-sa'
  const clients = cfg.data.filter(c => c.groupe === isGroupe)
  const agg = aggregate(clients)
  const categoryLabel = isGroupe ? 'Client Groupe' : 'Client Hors Groupe'

  // Count clients per KPI filter
  const countEncaisse = clients.filter(FILTERS.encaisse).length
  const countContentieux = clients.filter(FILTERS.contentieux).length
  const countReste = clients.filter(FILTERS.reste).length

  // Count clients per year
  const yearCounts = {
    all: clients.length,
    2025: clients.filter(YEAR_FILTERS[2025]).length,
    2026: clients.filter(YEAR_FILTERS[2026]).length,
  }

  // Apply all filters + sort
  const filtered = useMemo(() => {
    const kpiFn = kpiFilter ? (FILTERS[kpiFilter] || FILTERS.all) : FILTERS.all
    const yearFn = YEAR_FILTERS[yearFilter] || YEAR_FILTERS.all
    const natureFn = natureFilter ? (NATURE_FILTERS[natureFilter] || (() => true)) : () => true
    return [...clients.filter(c => kpiFn(c) && yearFn(c) && natureFn(c))].sort((a, b) => {
      if (sortMode === 'montant-desc') return (b.totalCreances || 0) - (a.totalCreances || 0)
      if (sortMode === 'montant-asc') return (a.totalCreances || 0) - (b.totalCreances || 0)
      if (sortMode === 'date-asc') {
        const aYear = (a.montant2026 || 0) > 0 ? 2026 : 2025
        const bYear = (b.montant2026 || 0) > 0 ? 2026 : 2025
        return aYear !== bYear ? aYear - bYear : (b.totalCreances || 0) - (a.totalCreances || 0)
      }
      if (sortMode === 'date-desc') {
        const aYear = (a.montant2026 || 0) > 0 ? 2026 : 2025
        const bYear = (b.montant2026 || 0) > 0 ? 2026 : 2025
        return aYear !== bYear ? bYear - aYear : (b.totalCreances || 0) - (a.totalCreances || 0)
      }
      return 0
    })
  }, [clients, kpiFilter, yearFilter, natureFilter, sortMode])

  const hasActiveFilter = (kpiFilter && kpiFilter !== 'all') || yearFilter !== 'all' || !!natureFilter

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, paddingTop: 20 }}>
      {/* Header */}
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 9, letterSpacing: '0.3em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 8 }}>
          {cfg.label} — {categoryLabel}
        </div>
        <ClientCount count={clients.length} />
      </div>

      {/* Tab bar Groupe / Hors Groupe + View toggle for TCM */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
        <CategoryTabs entity={entity} active={category} />
        {!isFlx && <ViewToggle active={viewMode} onChange={setViewMode} />}
      </div>

      {/* KPI filter cards */}
      <KpiFilterCards
        active={kpiFilter}
        onSelect={setKpiFilter}
        items={[
          { label: 'Total Créances', value: fmtMga(agg.totalCreances), color: COLOR, filterKey: 'all', count: clients.length },
          { label: 'Encaissé', value: fmtMga(agg.encaissements), color: '#00ab63', filterKey: 'encaisse', count: countEncaisse, pct: agg.totalCreances > 0 ? ((agg.encaissements / agg.totalCreances) * 100).toFixed(0) : 0 },
          { label: 'Contentieux', value: fmtMga(agg.standby + agg.contentieux), color: '#e05c5c', filterKey: 'contentieux', count: countContentieux, pct: agg.totalCreances > 0 ? (((agg.standby + agg.contentieux) / agg.totalCreances) * 100).toFixed(0) : 0 },
          { label: 'Reste à collecter', value: fmtMga(agg.resteACollecter), color: '#f39c12', filterKey: 'reste', count: countReste, pct: agg.totalCreances > 0 ? ((agg.resteACollecter / agg.totalCreances) * 100).toFixed(0) : 0 },
        ]}
      />
      <KpiCards items={[
        { label: 'Retard moyen', value: `${agg.avgRetard}j`, color: agg.avgRetard > 180 ? '#e05c5c' : agg.avgRetard > 90 ? '#f37056' : '#f39c12' },
        { label: 'Retard max', value: `${agg.maxRetard}j`, color: '#e05c5c' },
        { label: 'En retard', value: `${agg.countRetard}`, color: '#f37056', unit: `sur ${clients.length} clients`, pct: clients.length > 0 ? ((agg.countRetard / clients.length) * 100).toFixed(0) : 0 },
      ]} />

      {/* Nature filter cards */}
      {isFlx
        ? <FlxNatureKpiCards clients={clients} active={natureFilter} onSelect={setNatureFilter} />
        : <TcmNatureKpiCards clients={clients} active={natureFilter} onSelect={setNatureFilter} />
      }

      {/* Year filter + Sort controls */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', justifyContent: 'center' }}>
        <YearFilter active={yearFilter} onChange={setYearFilter} counts={yearCounts} />
        <div style={{ width: 1, height: 20, background: 'var(--card-border)' }} />
        <SortControls active={sortMode} onChange={setSortMode} />
      </div>

      {/* Active filter indicator */}
      {hasActiveFilter && (
        <div style={{ fontSize: 10, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
          <span>{filtered.length} client{filtered.length > 1 ? 's' : ''} affiché{filtered.length > 1 ? 's' : ''}</span>
          <button
            onClick={() => { setKpiFilter(null); setYearFilter('all'); setNatureFilter(null); setSortMode('montant-desc'); setViewMode('client') }}
            style={{ background: 'none', border: `1px solid ${COLOR}44`, borderRadius: 6, padding: '2px 8px', color: COLOR, fontSize: 9, cursor: 'pointer', fontWeight: 600, letterSpacing: '0.05em' }}
          >
            Réinitialiser
          </button>
        </div>
      )}

      {/* Cash flow chart */}
      <CashFlowChart monthlyData={cfg.monthly} />

      {/* Cards — Client view or Project view */}
      {viewMode === 'client' ? (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, width: '100%', maxWidth: 1000, paddingBottom: 40 }}>
            {filtered.map((client, i) => (
              <ClientCard key={client.code || client.client || i} client={client} isFlx={isFlx} />
            ))}
          </div>
          {filtered.length === 0 && (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
              Aucun client pour ce filtre
            </div>
          )}
        </>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, width: '100%', maxWidth: 1000, paddingBottom: 40 }}>
            {TCM_PROJECTS.map((project, i) => (
              <ProjectCard key={project.projet || i} project={project} onClick={() => navigate(`/finance/tcm/projet/${encodeURIComponent(project.projet)}`)} />
            ))}
          </div>
          {TCM_PROJECTS.length === 0 && (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
              Aucun projet
            </div>
          )}
        </>
      )}
    </div>
  )
}
