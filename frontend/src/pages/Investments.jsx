import { useState, useMemo, useEffect, useCallback } from 'react'
import { invProjects } from '../data/investments_data'
import SectionHeader from '../components/SectionHeader'

const ACCENT = '#f37056'
const ACCENT_RGB = '243,112,86'
const TEAL = '#4ecdc4'

/** Parse invest strings like "5.6 M$", "150 k$" into numbers in M$ */
function parseAmount(s) {
  if (!s || s === '\u2014') return 0
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
    if (v === 0 && withCapex.length === 0) return '\u2014'
    return v >= 1 ? v.toFixed(1) : (v * 1000).toFixed(0) + ' k'
  }

  return {
    total,
    enCours,
    budget: fmtVal(budgetTotal),
    decaisse: fmtVal(decaisseTotal),
    pct: withCapex.length === 0 ? '\u2014' : pctDecaisse + '%',
    pctNum: pctDecaisse,
    withCapex: withCapex.length,
    sansCapex: total - withCapex.length,
    reste: withCapex.length === 0 ? '\u2014' : reste.toFixed(1),
  }
}

/* ========== SUMMARY COLUMN (Externe/Interne) ========== */
function SummaryColumn({ title, kpis, onClick }) {
  return (
    <div className="e-col">
      <div className="e-col-title" style={{ color: ACCENT }}>{title}</div>
      <div
        className="capex-section-card e-card inv-card"
        onClick={onClick}
        style={{ borderColor: `rgba(${ACCENT_RGB},0.35)`, cursor: 'pointer', flex: 1 }}
        onMouseEnter={e => {
          e.currentTarget.style.borderColor = `rgba(${ACCENT_RGB},0.7)`
          e.currentTarget.style.background = `rgba(${ACCENT_RGB},0.06)`
          e.currentTarget.style.boxShadow = `0 16px 40px rgba(${ACCENT_RGB},0.2)`
          e.currentTarget.style.transform = 'translateY(-3px)'
        }}
        onMouseLeave={e => {
          e.currentTarget.style.borderColor = `rgba(${ACCENT_RGB},0.35)`
          e.currentTarget.style.background = ''
          e.currentTarget.style.boxShadow = ''
          e.currentTarget.style.transform = ''
        }}
      >
        {/* Projets */}
        <div className="e-sec">
          <div className="e-sec-label" style={{ color: `rgba(${ACCENT_RGB},0.55)` }}>Projets</div>
          <div className="e-kpi-row">
            <div className="e-kpi-left">
              <div className="e-big" style={{ color: ACCENT }}>{kpis.total}</div>
              <div className="e-sub">Total</div>
            </div>
            <div className="e-kpi-center"><div className="e-kpi-sep" /></div>
            <div className="e-kpi-right">
              <div className="e-big" style={{ color: `rgba(${ACCENT_RGB},0.7)` }}>{kpis.enCours}</div>
              <div className="e-sub">En cours</div>
            </div>
          </div>
        </div>

        {/* Budget vs Decaisse */}
        <div className="e-sec">
          <div className="e-sec-label" style={{ color: `rgba(${ACCENT_RGB},0.55)` }}>Budget vs Decaisse</div>
          <div className="e-kpi-row">
            <div className="e-kpi-left">
              <div className="e-big">{kpis.budget} <span className="e-big-unit">M$</span></div>
              <div className="e-sub">Budget</div>
            </div>
            <div className="e-kpi-center">
              <div className="e-pct" style={{ color: TEAL }}>{kpis.pct}</div>
              <div className="e-pct-arrow" style={{ color: 'var(--text-dim)' }}>decaisse</div>
            </div>
            <div className="e-kpi-right">
              <div className="e-big">{kpis.decaisse} <span className="e-big-unit">M$</span></div>
              <div className="e-sub">Decaisse</div>
            </div>
          </div>
        </div>

        {/* Couverture CAPEX */}
        <div className="e-sec">
          <div className="e-sec-label" style={{ color: `rgba(${ACCENT_RGB},0.55)` }}>Couverture CAPEX</div>
          <div className="e-kpi-row">
            <div className="e-kpi-left">
              <div className="e-big">{kpis.withCapex} <span className="e-big-unit">/ {kpis.total}</span></div>
              <div className="e-sub">Avec donnees CAPEX</div>
            </div>
            <div className="e-kpi-center"><div className="e-kpi-sep" /></div>
            <div className="e-kpi-right">
              <div className="e-big" style={{ color: `rgba(${ACCENT_RGB},0.7)` }}>{kpis.sansCapex}</div>
              <div className="e-sub">Sans donnees</div>
            </div>
          </div>
        </div>

        {/* Taux d'execution */}
        <div className="e-sec">
          <div className="e-sec-label" style={{ color: `rgba(${ACCENT_RGB},0.55)` }}>Taux d'execution</div>
          <div className="e-kpi-row">
            <div className="e-kpi-left">
              <div className="e-arret-num" style={{ color: TEAL }}>{kpis.pct}</div>
              <div className="e-arret-sub">execution globale</div>
            </div>
            <div className="e-kpi-center"><div className="e-kpi-sep" /></div>
            <div className="e-kpi-right">
              <div className="e-mid" style={{ color: 'var(--text-secondary)' }}>
                {kpis.reste} <span className="e-mid-unit" style={{ color: 'var(--text-dim)' }}>M$</span>
              </div>
              <div className="e-arret-sub2">reste a decaisser</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ========== PROJECT CARD (grid view) ========== */
function InvProjectCard({ project, onClick }) {
  const hasCx = project.capex !== null
  const investVal = hasCx ? project.capex.invest : '\u2014'
  const decaisseVal = hasCx ? project.capex.etat : '\u2014'
  const execVal = hasCx ? project.capex.pct + '%' : '\u2014'
  const pctWidth = hasCx ? project.capex.pct : 0
  const statusColor = project.status === 'En cours' ? TEAL : (project.status === 'Termine' ? '#a8d98a' : 'var(--text-muted)')

  return (
    <div
      className="capex-section-card"
      onClick={onClick}
      style={{ borderColor: `rgba(${ACCENT_RGB},0.2)`, cursor: 'pointer', padding: 16, transition: 'all 0.2s' }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = `rgba(${ACCENT_RGB},0.5)`; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 8px 24px rgba(${ACCENT_RGB},0.15)` }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = `rgba(${ACCENT_RGB},0.2)`; e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '' }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: 'clamp(14px,1.2vw,18px)', fontWeight: 800, color: 'var(--text)' }}>{project.nom}</div>
        <div style={{ fontSize: 9, fontWeight: 700, color: statusColor, border: '1px solid', borderRadius: 4, padding: '2px 6px' }}>{project.status}</div>
      </div>
      <div style={{ fontSize: 10, color: 'var(--text-dim)', marginTop: 4 }}>S{project.week} &middot; {project.resp}</div>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
        <div>
          <div style={{ fontSize: 9, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Invest</div>
          <div style={{ fontSize: 16, fontWeight: 800, color: ACCENT }}>{investVal}</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 9, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Decaisse</div>
          <div style={{ fontSize: 16, fontWeight: 800 }}>{decaisseVal}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 9, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Execution</div>
          <div style={{ fontSize: 16, fontWeight: 800, color: TEAL }}>{execVal}</div>
        </div>
      </div>

      <div style={{ width: '100%', height: 4, background: `rgba(${ACCENT_RGB},0.1)`, borderRadius: 2, marginTop: 8 }}>
        <div style={{ width: `${pctWidth}%`, height: '100%', background: ACCENT, borderRadius: 2 }} />
      </div>
    </div>
  )
}

/* ========== PROJECT DETAIL VIEW ========== */
function InvDetail({ project, onClose, allOfType, onSelect }) {
  const hasCx = project.capex !== null
  const statusColor = project.status === 'En cours' ? TEAL : '#a8d98a'

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '16px 24px' }}>
      {/* Peer navigation */}
      <div className="site-nav" style={{ margin: '8px 0 0', flexWrap: 'wrap', gap: 6, display: 'flex' }}>
        {allOfType.map(fp => (
          <button
            key={fp.id}
            className={`site-nav-btn inv-nav-btn${fp.id === project.id ? ' active' : ''}`}
            onClick={() => onSelect(fp)}
            style={{ whiteSpace: 'nowrap' }}
          >
            {fp.nom}
          </button>
        ))}
      </div>

      <div className="capex-section-card" style={{ borderColor: `rgba(${ACCENT_RGB},0.25)`, padding: 24, marginTop: 16 }}>
        {/* Header row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.15em' }}>Responsable</div>
            <div style={{ fontSize: 14, fontWeight: 700 }}>{project.resp}</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.15em' }}>Statut</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: statusColor }}>{project.status}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.15em' }}>Derniere MAJ</div>
            <div style={{ fontSize: 14, fontWeight: 700 }}>Semaine {project.week}</div>
          </div>
        </div>

        {/* CAPEX data */}
        {hasCx && (
          <div style={{ borderTop: `1px solid rgba(${ACCENT_RGB},0.1)`, paddingTop: 12 }}>
            <div style={{ fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 12 }}>Donnees CAPEX</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 10, color: 'var(--text-dim)' }}>Investissement</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: ACCENT }}>{project.capex.invest}</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 10, color: 'var(--text-dim)' }}>Decaisse</div>
                <div style={{ fontSize: 22, fontWeight: 800 }}>{project.capex.etat}</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 10, color: 'var(--text-dim)' }}>Execution</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: TEAL }}>{project.capex.pct}%</div>
              </div>
            </div>
            <div style={{ width: '100%', height: 6, background: `rgba(${ACCENT_RGB},0.1)`, borderRadius: 3, marginTop: 12 }}>
              <div style={{ width: `${project.capex.pct}%`, height: '100%', background: ACCENT, borderRadius: 3 }} />
            </div>
          </div>
        )}

        {!hasCx && (
          <div style={{ borderTop: `1px solid rgba(${ACCENT_RGB},0.1)`, paddingTop: 16, textAlign: 'center', fontSize: 13, color: 'var(--text-muted)' }}>
            Pas de donnees CAPEX disponibles
          </div>
        )}
      </div>
    </div>
  )
}

/* ========== GRID VIEW (Level 2) ========== */
function GridView({ type, onBack, onSelectProject, onSwitchType }) {
  const kpis = calcCapexKpis(type)
  const projects = invProjects.filter(p => p.type === type)
  const typeLabel = type === 'externe' ? 'Externe' : 'Interne'

  return (
    <div style={{ paddingTop: 0 }}>
      {/* Type nav */}
      <div className="site-nav" style={{ margin: '8px auto 0', maxWidth: 400, justifyContent: 'center', display: 'flex', gap: 6 }}>
        <button
          className={`site-nav-btn inv-nav-btn${type === 'externe' ? ' active' : ''}`}
          onClick={() => onSwitchType('externe')}
        >
          Externe
        </button>
        <button
          className={`site-nav-btn inv-nav-btn${type === 'interne' ? ' active' : ''}`}
          onClick={() => onSwitchType('interne')}
        >
          Interne
        </button>
      </div>

      {/* KPI row */}
      <div className="inv-grid-kpi" style={{ padding: '16px 24px 0' }}>
        {[
          { lbl: 'Projets', val: kpis.total, unit: 'Total' },
          { lbl: 'Budget revise', val: kpis.budget + ' M$', unit: 'Investissement CAPEX' },
          { lbl: 'Decaisse', val: kpis.pct, unit: "Taux d'execution" },
          { lbl: 'Montant decaisse', val: kpis.decaisse + ' M$', unit: 'Realise' },
        ].map((k, i) => (
          <div key={i} className="s1-card" style={{ background: `rgba(${ACCENT_RGB},0.04)`, borderColor: `rgba(${ACCENT_RGB},0.18)` }}>
            <div className="s1-card-label" style={{ color: `rgba(${ACCENT_RGB},0.5)` }}>{k.lbl}</div>
            <div className="s1-card-value" style={{ color: 'var(--text)' }}>{k.val}</div>
            <div className="s1-card-unit-line" style={{ color: 'var(--text-dim)' }}>{k.unit}</div>
          </div>
        ))}
      </div>

      <div style={{ padding: '8px 24px 0' }}>
        <div style={{ textAlign: 'center', fontSize: 9, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: `rgba(${ACCENT_RGB},0.4)` }}>
          Projets \u2014 Cliquez pour le detail
        </div>
      </div>

      {/* Project cards */}
      <div className="inv-project-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, padding: '8px 24px 16px' }}>
        {projects.map(p => (
          <InvProjectCard key={p.id} project={p} onClick={() => onSelectProject(p)} />
        ))}
      </div>
    </div>
  )
}

/* ========== MAIN INVESTMENTS COMPONENT ========== */
export default function Investments() {
  const [activeType, _setActiveType] = useState(null) // 'externe' | 'interne'
  const [selectedProject, _setSelectedProject] = useState(null)

  const setActiveType = useCallback((t) => {
    if (t) window.history.pushState({ inv: 'type' }, '')
    _setActiveType(t)
  }, [])
  const setSelectedProject = useCallback((p) => {
    if (p) window.history.pushState({ inv: 'project' }, '')
    _setSelectedProject(p)
  }, [])

  useEffect(() => {
    const onPopState = () => {
      if (selectedProject) { _setSelectedProject(null); return }
      if (activeType) { _setActiveType(null); return }
    }
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [activeType, selectedProject])

  const extKpis = useMemo(() => calcCapexKpis('externe'), [])
  const intKpis = useMemo(() => calcCapexKpis('interne'), [])

  const extProjects = useMemo(() => invProjects.filter(p => p.type === 'externe'), [])
  const intProjects = useMemo(() => invProjects.filter(p => p.type === 'interne'), [])

  // Project detail view
  if (selectedProject) {
    const allOfType = selectedProject.type === 'externe' ? extProjects : intProjects
    return (
      <div style={{ background: 'var(--dark)', minHeight: '100dvh' }}>
        <SectionHeader name="Investments" color={ACCENT} onBack={() => setSelectedProject(null)} />
        <div className="inv-page-inner">
          <InvDetail
            project={selectedProject}
            onClose={() => setSelectedProject(null)}
            allOfType={allOfType}
            onSelect={(p) => setSelectedProject(p)}
          />
        </div>
      </div>
    )
  }

  // Grid view (level 2)
  if (activeType) {
    return (
      <div style={{ background: 'var(--dark)', minHeight: '100dvh' }}>
        <SectionHeader name="Investments" color={ACCENT} onBack={() => setActiveType(null)} />
        <div className="inv-page-inner">
          <GridView
            type={activeType}
            onBack={() => setActiveType(null)}
            onSelectProject={(p) => setSelectedProject(p)}
            onSwitchType={(t) => setActiveType(t)}
          />
        </div>
      </div>
    )
  }

  // Landing: two columns Externe / Interne
  return (
    <div style={{ background: 'var(--dark)', minHeight: '100dvh' }}>
      <SectionHeader name="Investments" color={ACCENT} />
      <div className="inv-page-inner">
        <div className="e-wrap inv-wrap">
          <SummaryColumn title="Externe" kpis={extKpis} onClick={() => setActiveType('externe')} />
          <SummaryColumn title="Interne" kpis={intKpis} onClick={() => setActiveType('interne')} />
        </div>
      </div>
    </div>
  )
}
