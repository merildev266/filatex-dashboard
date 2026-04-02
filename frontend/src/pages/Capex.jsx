import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { capexData } from '../data/capex_data'
import SectionHeader from '../components/SectionHeader'
import { hexToRgb, parseDollar } from '../utils/helpers'

const ACCENT = '#5e4c9f'
const ACCENT_RGB = '94,76,159'

const POLES = [
  {
    key: 'enr', label: 'EnR', dot: '#00ab63', dotShadow: 'rgba(0,171,99,0.5)',
    titleColor: '#a8d98a', barColor: '#00ab63',
    kpis: [
      { label: 'Budget revise', valKey: 'budgetRevise', vsKey: 'budgetInit', valColor: '#a8d98a' },
      { label: 'Engage', valKey: 'engage', progressKey: 'engagePct' },
      { label: 'TRI moyen', val: '~11%', vs: 'ENAT + LIDERA', valColor: '#a8d98a' },
      { label: 'Entites', val: '3', vs: 'ENAT \u00b7 LIDERA \u00b7 SERV', valColor: '#a8d98a' },
    ],
    projets: 32, budgetRevise: '153 M$', budgetInit: '188 M$', engage: '6.7 M$', engagePct: 4,
  },
  {
    key: 'hfo', label: 'HFO', dot: '#426ab3', dotShadow: 'rgba(66,106,179,0.5)',
    titleColor: '#8bb0ff', barColor: '#426ab3',
    kpis: [
      { label: 'Budget revise', valKey: 'budgetRevise', vsKey: 'budgetInit', valColor: '#8bb0ff' },
      { label: 'Engage', valKey: 'engage', progressKey: 'engagePct' },
      { label: 'TRI moyen', val: '~7%', vs: '3% a 13%', valColor: '#8bb0ff' },
      { label: 'Avancement', val: '34%', vs: 'du budget engage', valColor: '#8bb0ff' },
    ],
    projets: 7, budgetRevise: '8.3 M$', budgetInit: '8.6 M$', engage: '2.9 M$', engagePct: 34,
  },
  {
    key: 'immo', label: 'Immobilier', dot: '#FDB823', dotShadow: 'rgba(253,184,35,0.5)',
    titleColor: '#ffd84d', barColor: '#FDB823',
    kpis: [
      { label: 'Budget revise', valKey: 'budgetRevise', vsKey: 'budgetInit', valColor: '#ffd84d' },
      { label: 'Engage', valKey: 'engage', progressKey: 'engagePct' },
      { label: 'ROI moyen', val: '~18%', vs: '9% a 30%', valColor: '#ffd84d' },
      { label: 'Categories', val: '3', vs: 'Travaux \u00b7 Dev \u00b7 Foncier', valColor: '#ffd84d' },
    ],
    projets: 24, budgetRevise: '105 M$', budgetInit: '158 M$', engage: '6.4 M$', engagePct: 6,
  },
  {
    key: 'ventures', label: 'Ventures', dot: '#f37056', dotShadow: 'rgba(243,112,86,0.5)',
    titleColor: '#ffaa88', barColor: '#f37056',
    kpis: [
      { label: 'Budget revise', valKey: 'budgetRevise', vsKey: 'budgetInit', valColor: '#ffaa88' },
      { label: 'Deploye', valKey: 'engage', progressKey: 'engagePct' },
      { label: 'TRI initial', val: '10%', vs: 'Hotel Tamatave', valColor: '#ffaa88' },
      { label: 'Alertes', val: '1', vs: 'Orga Earth (restruct.)', valColor: '#f37056' },
    ],
    projets: 9, budgetRevise: '29.7 M$', budgetInit: '30.9 M$', engage: '19.9 M$', engagePct: 67,
  },
]


function fmtM(val) {
  if (val === 0) return '\u2014'
  if (val >= 1) return val.toFixed(1) + ' M$'
  return (val * 1000).toFixed(0) + ' k$'
}

function StatusBadge({ status, color }) {
  const label = { 'on-track': 'En cours', delayed: 'Retard', 'over-budget': 'Depassement' }[status] || status
  const bg = status === 'delayed' ? 'rgba(224,92,92,0.15)' : `rgba(${hexToRgb(color)},0.12)`
  const fg = 'var(--text)'
  return (
    <span className="cpj-status" style={{ background: bg, color: fg }}>
      {label}
    </span>
  )
}

/* ========== PROJECT DETAIL VIEW ========== */
function ProjectDetail({ project, color, colorRgb, onClose }) {
  const deltaColor = project.deltaInvest && project.deltaInvest.startsWith('-') ? '#00ab63' : '#f37056'

  return (
    <div style={{ maxWidth: '100%', margin: '0 auto', padding: '16px 24px' }}>
      <div className="capex-proj-card" style={{ borderColor: `rgba(${colorRgb},0.2)`, marginTop: 16 }}>
        {/* Title */}
        <div className="cpj-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 12, height: 12, borderRadius: '50%', background: color, boxShadow: `0 0 10px ${color}` }} />
            <span className="cpj-name">{project.name}</span>
          </div>
          <StatusBadge status={project.status} color={color} />
        </div>

        {/* KPI grid */}
        <div className="cpj-grid cpj-grid-4" style={{ gridTemplateColumns: 'repeat(4,1fr)' }}>
          {[
            { label: 'Invest. Initial', value: project.investInit },
            { label: 'Invest. Reel', value: project.investReel, color },
            { label: 'Delta', value: project.deltaInvest, color: project.deltaInvest === '\u2014' ? undefined : deltaColor },
            { label: 'TRI', value: `${project.triInit}${project.triReel && project.triReel !== '\u2014' ? ` / ${project.triReel}` : ''}`, color: '#4ecdc4' },
          ].map((k, i) => (
            <div key={i} className="cpj-block">
              <div className="cpj-block-label">{k.label}</div>
              <div style={{ fontSize: 15, fontWeight: 800, color: k.color || 'var(--text)' }}>{k.value}</div>
            </div>
          ))}
        </div>

        {/* Progress */}
        <div style={{ borderTop: '1px solid var(--separator)', paddingTop: 16, marginTop: 16 }}>
          <div className="cpj-block-label" style={{ marginBottom: 8 }}>Etat d'investissement</div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 8 }}>
            {project.etatEnCours} sur {project.etatTotal}
          </div>
          <div style={{ width: '100%', height: 6, background: `rgba(${colorRgb},0.1)`, borderRadius: 3 }}>
            <div style={{ width: `${project.etatPct}%`, height: '100%', background: color, borderRadius: 3 }} />
          </div>
          <div style={{ fontSize: 26, fontWeight: 800, color, marginTop: 8 }}>{project.etatPct}%</div>
          <div style={{ fontSize: 9, color: 'var(--text-dim)' }}>engage sur budget total</div>
        </div>

        {/* Dates */}
        <div className="cpj-grid cpj-grid-4" style={{ gridTemplateColumns: 'repeat(4,1fr)', borderTop: '1px solid var(--separator)', paddingTop: 16, marginTop: 16 }}>
          {[
            { label: 'Debut Init', value: project.dateDebInit },
            { label: 'Debut Reel', value: project.dateDebReel },
            { label: 'Fin Init', value: project.dateFinInit },
            { label: 'Fin Reel', value: project.dateFinReel },
          ].map((k, i) => (
            <div key={i}>
              <div className="cpj-block-label">{k.label}</div>
              <div style={{ fontSize: 13, fontWeight: 700 }}>{k.value}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ========== CATEGORY DRILL-DOWN VIEW ========== */
function CategoryView({ poleKey, onBack, onSelectProject }) {
  const catData = capexData[poleKey]
  if (!catData) return null

  const pole = POLES.find(p => p.key === poleKey)
  const color = catData.color
  const colorRgb = catData.colorRgb

  const projects = catData.projects
  const total = projects.length
  const delayed = projects.filter(p => p.status === 'delayed').length
  let engageTotal = 0
  let etatTotal = 0
  projects.forEach(p => {
    engageTotal += parseDollar(p.etatEnCours)
    etatTotal += parseDollar(p.etatTotal)
  })
  const avgPct = projects.length > 0 ? Math.round(projects.reduce((s, p) => s + (p.etatPct || 0), 0) / projects.length) : 0

  return (
    <div className="capex-page-wrap" style={{ maxWidth: '100%', margin: '0 auto', padding: '0 40px 80px' }}>
      {/* Title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: color }} />
        <span style={{ fontSize: 18, fontWeight: 800, color: 'var(--text)' }}>{catData.title}</span>
      </div>

      {/* KPI row */}
      <div className="capex-cat-kpis" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 28 }}>
        {[
          { label: 'Projets', value: total, color },
          { label: 'En retard', value: delayed, color: delayed > 0 ? '#E05C5C' : color },
          { label: 'Budget total', value: fmtM(etatTotal), color },
          { label: 'Engage moyen', value: avgPct + '%', color: '#4ecdc4' },
        ].map((k, i) => (
          <div key={i} className="capex-kpi-card" style={{ textAlign: 'center' }}>
            <div className="ckpi-label">{k.label}</div>
            <div className="ckpi-val" style={{ color: k.color }}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* Project cards grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 16 }}>
        {projects.map(p => (
          <div
            key={p.id}
            className="capex-section-card"
            onClick={() => onSelectProject(p)}
            style={{ borderColor: `rgba(${colorRgb},0.2)`, padding: 16 }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = `rgba(${colorRgb},0.5)`; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 8px 24px rgba(${colorRgb},0.15)` }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = `rgba(${colorRgb},0.2)`; e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '' }}
          >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: color, boxShadow: `0 0 8px ${color}` }} />
                <span style={{ fontSize: 'clamp(13px,1.2vw,16px)', fontWeight: 800, color: 'var(--text)' }}>{p.name}</span>
              </div>
              <StatusBadge status={p.status} color={color} />
            </div>

            {/* Investment row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12 }}>
              <div>
                <div style={{ fontSize: 9, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Init.</div>
                <div style={{ fontSize: 14, fontWeight: 800 }}>{p.investInit}</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 9, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Reel</div>
                <div style={{ fontSize: 14, fontWeight: 800, color }}>{p.investReel}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 9, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>TRI</div>
                <div style={{ fontSize: 14, fontWeight: 800, color: '#4ecdc4' }}>{p.triInit}</div>
              </div>
            </div>

            {/* Progress bar */}
            <div style={{ marginTop: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <span style={{ fontSize: 9, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                  {p.etatEnCours} sur {p.etatTotal}
                </span>
                <span style={{ fontSize: 11, fontWeight: 800, color }}>{p.etatPct}%</span>
              </div>
              <div style={{ width: '100%', height: 4, background: `rgba(${colorRgb},0.1)`, borderRadius: 2 }}>
                <div style={{ width: `${p.etatPct}%`, height: '100%', background: color, borderRadius: 2, transition: 'width 0.5s' }} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ========== MAIN CAPEX COMPONENT ========== */
export default function Capex() {
  const navigate = useNavigate()
  const [activeCategory, _setActiveCategory] = useState(null)
  const [selectedProject, _setSelectedProject] = useState(null)

  // Wrap setters to push browser history entries
  const setActiveCategory = useCallback((cat) => {
    if (cat) window.history.pushState({ capex: 'category' }, '')
    _setActiveCategory(cat)
  }, [])
  const setSelectedProject = useCallback((proj) => {
    if (proj) window.history.pushState({ capex: 'project' }, '')
    _setSelectedProject(proj)
  }, [])

  // Handle browser back button (Samsung, swipe, etc.)
  useEffect(() => {
    const onPopState = () => {
      if (selectedProject) { _setSelectedProject(null); return }
      if (activeCategory) { _setActiveCategory(null); return }
    }
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [activeCategory, selectedProject])

  // Project detail view
  if (selectedProject && activeCategory) {
    const catData = capexData[activeCategory]
    return (
      <div style={{ background: 'var(--dark)', minHeight: '100dvh' }}>
        <SectionHeader name="CAPEX" color={ACCENT} onBack={() => setSelectedProject(null)} />
        <ProjectDetail
          project={selectedProject}
          color={catData.color}
          colorRgb={catData.colorRgb}
          onClose={() => setSelectedProject(null)}
        />
      </div>
    )
  }

  // Category drill-down view
  if (activeCategory) {
    return (
      <div style={{ background: 'var(--dark)', minHeight: '100dvh' }}>
        <SectionHeader name="CAPEX" color={ACCENT} onBack={() => setActiveCategory(null)} />
        <CategoryView
          poleKey={activeCategory}
          onBack={() => setActiveCategory(null)}
          onSelectProject={(p) => setSelectedProject(p)}
        />
      </div>
    )
  }

  // Landing page
  return (
    <div style={{ background: 'var(--dark)', minHeight: '100dvh' }}>
    <SectionHeader name="CAPEX" color={ACCENT} />
    <div className="capex-page-wrap" style={{ maxWidth: '100%', margin: '0 auto', padding: '0 40px 80px' }}>

      {/* ══ GLOBAL SUMMARY ══ */}
      <div style={{ marginBottom: 40 }}>
        <div className="capex-section-label">Vue consolidee \u00b7 Tous poles</div>
        <div className="capex-top-kpis" style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 16 }}>

          {/* Projets Actifs */}
          <div className="capex-kpi-card">
            <div className="ckpi-label">Projets actifs</div>
            <div className="ckpi-val">72</div>
            <div className="ckpi-sub">4 poles</div>
          </div>

          {/* Budget revise */}
          <div className="capex-kpi-card">
            <div className="ckpi-label">Budget revise</div>
            <div className="ckpi-val">296 M$</div>
            <div className="ckpi-sub-row">
              <span className="ckpi-tag-init">Initial 386 M$</span>
              <span className="ckpi-delta down">-23%</span>
            </div>
          </div>

          {/* Realise / Engage */}
          <div className="capex-kpi-card">
            <div className="ckpi-label">Realise / Engage</div>
            <div className="ckpi-val">35.9 M$</div>
            <div className="ckpi-progress-wrap">
              <div className="ckpi-progress-track">
                <div className="ckpi-progress-bar" style={{ width: '12%', background: ACCENT }} />
              </div>
              <span className="ckpi-pct">12%</span>
            </div>
          </div>

          {/* Repartition budget */}
          <div className="capex-kpi-card">
            <div className="ckpi-label">Repartition budget</div>
            <div className="ckpi-val" style={{ fontSize: 18 }}>EnR 52%</div>
            <div className="ckpi-sub-row">
              <span style={{ fontSize: 9, color: 'var(--text-dim)' }}>IMMO 36%</span>
              <span style={{ fontSize: 9, color: 'var(--text-dim)' }}>VEN 10%</span>
              <span style={{ fontSize: 9, color: 'var(--text-dim)' }}>HFO 3%</span>
            </div>
          </div>

          {/* Alertes */}
          <div className="capex-kpi-card">
            <div className="ckpi-label">Alertes projets</div>
            <div className="ckpi-val" style={{ color: '#f37056' }}>3</div>
            <div className="ckpi-sub-row">
              <span style={{ fontSize: 9, color: 'var(--text-dim)' }}>2 retards EnR</span>
              <span style={{ fontSize: 9, color: 'var(--text-dim)' }}>1 restructuration</span>
            </div>
          </div>

        </div>
      </div>

      {/* ══ POLES D'INVESTISSEMENT ══ */}
      <div className="capex-section-label">Poles d'investissement</div>
      <div className="capex-poles-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 20 }}>

        {POLES.map(pole => (
          <div
            key={pole.key}
            className="capex-section-card"
            data-pole={pole.key}
            onClick={() => setActiveCategory(pole.key)}
          >
            {/* Header */}
            <div className="csec-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div className="csec-dot" style={{ background: pole.dot, boxShadow: `0 0 10px ${pole.dotShadow}` }} />
                <span className="csec-title" style={{ color: 'var(--text)' }}>{pole.label}</span>
                <span className="csec-badge">{pole.projets} projets</span>
              </div>
              <span className="csec-arrow">&rarr;</span>
            </div>

            {/* KPIs */}
            <div className="csec-kpis">
              {pole.kpis.map((kpi, i) => (
                <div key={i} className="csec-kpi">
                  <div className="csec-kpi-label">{kpi.label}</div>
                  <div className="csec-kpi-val" style={kpi.valColor ? { color: kpi.valColor } : {}}>
                    {kpi.val || pole[kpi.valKey]}
                  </div>
                  {kpi.vsKey && (
                    <div className="csec-kpi-vs">/ {pole[kpi.vsKey]} initial</div>
                  )}
                  {kpi.vs && (
                    <div className="csec-kpi-vs">{kpi.vs}</div>
                  )}
                  {kpi.progressKey && (
                    <div className="csec-progress-mini">
                      <div style={{ width: `${pole[kpi.progressKey]}%`, background: pole.barColor }} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}

      </div>
    </div>
    </div>
  )
}
