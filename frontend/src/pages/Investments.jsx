import { useState, useMemo } from 'react'
import { invProjects } from '../data/investments_data'

const ACCENT = '#f37056'
const ACCENT_RGB = '243,112,86'
const TEAL = '#4ecdc4'

/** Parse invest strings like "5.6 M$", "150 k$" into numbers in M$ */
function parseAmount(s) {
  if (!s || s === '—') return 0
  const cleaned = s.replace(/[^\d.,kKmM$-]/g, '').replace(',', '.')
  const num = parseFloat(cleaned.replace(/[kKmM$]/g, '')) || 0
  if (/M/i.test(s)) return num
  if (/k/i.test(s)) return num / 1000
  return num / 1_000_000
}

function calcCapexKpis(type) {
  const filtered = invProjects.filter(p => p.type === type)
  const total = filtered.length
  const enCours = filtered.filter(p => p.status === 'En cours').length
  const withCapex = filtered.filter(p => p.capex !== null)
  let budgetTotal = 0
  let decaisseTotal = 0

  withCapex.forEach(p => {
    budgetTotal += parseAmount(p.capex.invest)
    decaisseTotal += parseAmount(p.capex.etat)
  })

  const pctDecaisse = budgetTotal > 0 ? Math.round((decaisseTotal / budgetTotal) * 100) : 0
  const reste = budgetTotal - decaisseTotal

  const fmtVal = (v) => {
    if (v === 0 && withCapex.length === 0) return '—'
    return v >= 1 ? v.toFixed(1) + ' M$' : (v * 1000).toFixed(0) + ' k$'
  }

  return {
    total,
    enCours,
    budget: fmtVal(budgetTotal),
    decaisse: fmtVal(decaisseTotal),
    pct: withCapex.length === 0 ? '—' : pctDecaisse + '%',
    pctNum: pctDecaisse,
    withCapex: withCapex.length,
    sansCapex: total - withCapex.length,
    reste: withCapex.length === 0 ? '—' : reste.toFixed(1) + ' M$',
  }
}

function InvCard({ project, onClick }) {
  const hasCx = project.capex !== null
  const investVal = hasCx ? project.capex.invest : '—'
  const decaisseVal = hasCx ? project.capex.etat : '—'
  const execVal = hasCx ? project.capex.pct + '%' : '—'
  const pctWidth = hasCx ? project.capex.pct : 0
  const statusColor = project.status === 'En cours' ? TEAL : (project.status === 'Termine' ? '#a8d98a' : 'rgba(255,255,255,0.4)')

  return (
    <button
      onClick={onClick}
      className="glass-card p-4 text-left w-full border transition-all duration-200
                 hover:-translate-y-0.5 hover:shadow-lg cursor-pointer"
      style={{ borderColor: `rgba(${ACCENT_RGB},0.15)` }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = `rgba(${ACCENT_RGB},0.4)` }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = `rgba(${ACCENT_RGB},0.15)` }}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-bold text-[var(--text-primary)]">{project.nom}</span>
        <span
          className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border"
          style={{ color: statusColor, borderColor: statusColor }}
        >
          {project.status}
        </span>
      </div>

      <div className="text-[10px] text-[var(--text-muted)] mt-1">
        S{project.week} &middot; {project.resp}
      </div>

      {/* Capex row */}
      <div className="flex justify-between mt-3">
        <div>
          <div className="text-[9px] text-[var(--text-muted)] uppercase tracking-wider">Invest</div>
          <div className="text-base font-extrabold" style={{ color: ACCENT }}>{investVal}</div>
        </div>
        <div className="text-center">
          <div className="text-[9px] text-[var(--text-muted)] uppercase tracking-wider">Decaisse</div>
          <div className="text-base font-extrabold">{decaisseVal}</div>
        </div>
        <div className="text-right">
          <div className="text-[9px] text-[var(--text-muted)] uppercase tracking-wider">Execution</div>
          <div className="text-base font-extrabold" style={{ color: TEAL }}>{execVal}</div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full h-1 rounded-full mt-2" style={{ background: `rgba(${ACCENT_RGB},0.1)` }}>
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pctWidth}%`, background: ACCENT }} />
      </div>
    </button>
  )
}

function InvDetail({ project, onClose, allOfType }) {
  const hasCx = project.capex !== null
  const statusColor = project.status === 'En cours' ? TEAL : '#a8d98a'

  return (
    <div className="space-y-4">
      <button onClick={onClose} className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
        &larr; {project.type === 'externe' ? 'Externe' : 'Interne'}
      </button>

      {/* Peer navigation */}
      <div className="flex gap-2 flex-wrap">
        {allOfType.map(p => (
          <span
            key={p.id}
            className={`text-[10px] px-2 py-1 rounded cursor-default ${p.id === project.id
                ? 'font-bold'
                : 'text-[var(--text-muted)]'
              }`}
            style={p.id === project.id ? { background: `rgba(${ACCENT_RGB},0.2)`, color: ACCENT } : {}}
          >
            {p.nom}
          </span>
        ))}
      </div>

      <div className="glass-card p-6" style={{ borderColor: `rgba(${ACCENT_RGB},0.2)` }}>
        {/* Header row */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div>
            <div className="text-[9px] text-[var(--text-muted)] uppercase tracking-wider">Responsable</div>
            <div className="text-sm font-bold">{project.resp}</div>
          </div>
          <div className="text-center">
            <div className="text-[9px] text-[var(--text-muted)] uppercase tracking-wider">Statut</div>
            <div className="text-sm font-bold" style={{ color: statusColor }}>{project.status}</div>
          </div>
          <div className="text-right">
            <div className="text-[9px] text-[var(--text-muted)] uppercase tracking-wider">Derniere MAJ</div>
            <div className="text-sm font-bold">Semaine {project.week}</div>
          </div>
        </div>

        {/* CAPEX data */}
        {hasCx && (
          <div className="border-t border-[var(--border)] pt-4">
            <div className="text-[9px] text-[var(--text-muted)] uppercase tracking-wider mb-4">Donnees CAPEX</div>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-[10px] text-[var(--text-muted)]">Investissement</div>
                <div className="text-xl font-extrabold" style={{ color: ACCENT }}>{project.capex.invest}</div>
              </div>
              <div>
                <div className="text-[10px] text-[var(--text-muted)]">Decaisse</div>
                <div className="text-xl font-extrabold">{project.capex.etat}</div>
              </div>
              <div>
                <div className="text-[10px] text-[var(--text-muted)]">Execution</div>
                <div className="text-xl font-extrabold" style={{ color: TEAL }}>{project.capex.pct}%</div>
              </div>
            </div>
            <div className="w-full h-1.5 rounded-full mt-4" style={{ background: `rgba(${ACCENT_RGB},0.1)` }}>
              <div className="h-full rounded-full" style={{ width: `${project.capex.pct}%`, background: ACCENT }} />
            </div>
          </div>
        )}

        {!hasCx && (
          <div className="border-t border-[var(--border)] pt-4 text-center text-sm text-[var(--text-muted)]">
            Pas de donnees CAPEX disponibles
          </div>
        )}
      </div>
    </div>
  )
}

export default function Investments() {
  const [activeType, setActiveType] = useState(null) // 'externe' | 'interne'
  const [selectedProject, setSelectedProject] = useState(null)

  const extKpis = useMemo(() => calcCapexKpis('externe'), [])
  const intKpis = useMemo(() => calcCapexKpis('interne'), [])

  const extProjects = useMemo(() => invProjects.filter(p => p.type === 'externe'), [])
  const intProjects = useMemo(() => invProjects.filter(p => p.type === 'interne'), [])

  // Project detail view
  if (selectedProject) {
    const allOfType = selectedProject.type === 'externe' ? extProjects : intProjects
    return (
      <div className="p-4 md:p-6 max-w-5xl mx-auto">
        <InvDetail
          project={selectedProject}
          onClose={() => setSelectedProject(null)}
          allOfType={allOfType}
        />
      </div>
    )
  }

  // Type drill-down view
  if (activeType) {
    const kpis = activeType === 'externe' ? extKpis : intKpis
    const projects = activeType === 'externe' ? extProjects : intProjects
    const typeLabel = activeType === 'externe' ? 'Externe' : 'Interne'

    return (
      <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-6">
        {/* Back + title + type nav */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setActiveType(null)}
              className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
            >
              &larr; Ventures
            </button>
            <h2 className="text-lg font-bold" style={{ color: ACCENT }}>{typeLabel}</h2>
          </div>
          <div className="flex gap-2">
            {['externe', 'interne'].map(t => (
              <button
                key={t}
                onClick={() => setActiveType(t)}
                className={`text-xs px-3 py-1.5 rounded-md font-bold transition-all ${activeType === t
                    ? 'text-white'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                  }`}
                style={activeType === t ? { background: ACCENT } : {}}
              >
                {t === 'externe' ? 'Externe' : 'Interne'}
              </button>
            ))}
          </div>
        </div>

        {/* KPI row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Projets', value: kpis.total },
            { label: 'Budget revise', value: kpis.budget },
            { label: "Taux d'execution", value: kpis.pct, color: TEAL },
            { label: 'Realise', value: kpis.decaisse },
          ].map((k, i) => (
            <div key={i} className="glass-card p-4 text-center">
              <div className="text-[9px] text-[var(--text-muted)] uppercase tracking-wider mb-1">{k.label}</div>
              <div className="text-xl font-extrabold" style={{ color: k.color || ACCENT }}>{k.value}</div>
            </div>
          ))}
        </div>

        {/* Project cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {projects.map(p => (
            <InvCard key={p.id} project={p} onClick={() => setSelectedProject(p)} />
          ))}
        </div>
      </div>
    )
  }

  // Landing: overview with both types
  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-xl font-bold" style={{ color: ACCENT }}>Investments</h1>
        <p className="text-xs text-[var(--text-muted)] mt-1">Ventures &mdash; Investissements externes et internes</p>
      </div>

      {/* Two-column landing: Externe | Interne */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Externe */}
        <button
          onClick={() => setActiveType('externe')}
          className="glass-card p-5 text-left cursor-pointer border transition-all duration-200
                     hover:-translate-y-1 hover:shadow-lg relative overflow-hidden"
          style={{ borderColor: `rgba(${ACCENT_RGB},0.15)` }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = `rgba(${ACCENT_RGB},0.4)` }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = `rgba(${ACCENT_RGB},0.15)` }}
        >
          <div className="absolute top-0 left-0 right-0 h-[3px]" style={{ background: ACCENT }} />
          <h3 className="text-base font-bold mb-4" style={{ color: ACCENT }}>Externe</h3>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <div className="text-[9px] text-[var(--text-muted)] uppercase tracking-wider">Projets</div>
              <div className="text-2xl font-extrabold" style={{ color: ACCENT }}>{extKpis.total}</div>
            </div>
            <div>
              <div className="text-[9px] text-[var(--text-muted)] uppercase tracking-wider">En cours</div>
              <div className="text-2xl font-extrabold">{extKpis.enCours}</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-3">
            <div>
              <div className="text-[9px] text-[var(--text-muted)] uppercase tracking-wider">Budget</div>
              <div className="text-base font-extrabold" style={{ color: ACCENT }}>{extKpis.budget}</div>
            </div>
            <div>
              <div className="text-[9px] text-[var(--text-muted)] uppercase tracking-wider">Decaisse</div>
              <div className="text-base font-extrabold">{extKpis.decaisse}</div>
            </div>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-[9px] text-[var(--text-muted)] uppercase tracking-wider">Execution</span>
            <span className="text-sm font-extrabold" style={{ color: TEAL }}>{extKpis.pct}</span>
          </div>
          <div className="w-full h-1 rounded-full mt-1" style={{ background: `rgba(${ACCENT_RGB},0.1)` }}>
            <div className="h-full rounded-full" style={{ width: `${extKpis.pctNum}%`, background: ACCENT }} />
          </div>

          <div className="mt-3 text-[9px] text-[var(--text-muted)]">
            {extKpis.withCapex} avec CAPEX &middot; {extKpis.sansCapex} sans &middot; Reste: {extKpis.reste}
          </div>
        </button>

        {/* Interne */}
        <button
          onClick={() => setActiveType('interne')}
          className="glass-card p-5 text-left cursor-pointer border transition-all duration-200
                     hover:-translate-y-1 hover:shadow-lg relative overflow-hidden"
          style={{ borderColor: `rgba(${ACCENT_RGB},0.15)` }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = `rgba(${ACCENT_RGB},0.4)` }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = `rgba(${ACCENT_RGB},0.15)` }}
        >
          <div className="absolute top-0 left-0 right-0 h-[3px]" style={{ background: '#4ecdc4' }} />
          <h3 className="text-base font-bold mb-4" style={{ color: TEAL }}>Interne</h3>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <div className="text-[9px] text-[var(--text-muted)] uppercase tracking-wider">Projets</div>
              <div className="text-2xl font-extrabold" style={{ color: TEAL }}>{intKpis.total}</div>
            </div>
            <div>
              <div className="text-[9px] text-[var(--text-muted)] uppercase tracking-wider">En cours</div>
              <div className="text-2xl font-extrabold">{intKpis.enCours}</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-3">
            <div>
              <div className="text-[9px] text-[var(--text-muted)] uppercase tracking-wider">Budget</div>
              <div className="text-base font-extrabold" style={{ color: TEAL }}>{intKpis.budget}</div>
            </div>
            <div>
              <div className="text-[9px] text-[var(--text-muted)] uppercase tracking-wider">Decaisse</div>
              <div className="text-base font-extrabold">{intKpis.decaisse}</div>
            </div>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-[9px] text-[var(--text-muted)] uppercase tracking-wider">Execution</span>
            <span className="text-sm font-extrabold" style={{ color: TEAL }}>{intKpis.pct}</span>
          </div>
          <div className="w-full h-1 rounded-full mt-1" style={{ background: 'rgba(78,205,196,0.1)' }}>
            <div className="h-full rounded-full" style={{ width: `${intKpis.pctNum}%`, background: TEAL }} />
          </div>

          <div className="mt-3 text-[9px] text-[var(--text-muted)]">
            {intKpis.withCapex} avec CAPEX &middot; {intKpis.sansCapex} sans &middot; Reste: {intKpis.reste}
          </div>
        </button>
      </div>
    </div>
  )
}
