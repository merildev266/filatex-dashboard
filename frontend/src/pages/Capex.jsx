import { useState, useMemo } from 'react'
import { capexData } from '../data/capex_data'

const ACCENT = '#5e4c9f'

const CATEGORIES = [
  { key: 'enr', label: 'EnR' },
  { key: 'hfo', label: 'HFO' },
  { key: 'immo', label: 'Immobilier' },
  { key: 'ventures', label: 'Ventures' },
]

/** Parse a dollar string like "3 764 713 $" or "804 k$" or "3.8 M$" into a number in M$ */
function parseDollar(s) {
  if (!s || s === '—') return 0
  const cleaned = s.replace(/[^\d.,kKmM$-]/g, '').replace(',', '.')
  const num = parseFloat(cleaned.replace(/[kKmM$]/g, '')) || 0
  if (/M/i.test(s)) return num
  if (/k/i.test(s)) return num / 1000
  // raw number — guess based on magnitude
  return num / 1_000_000
}

function computeCategoryKpis(cat) {
  const projects = cat.projects
  const total = projects.length
  const delayed = projects.filter(p => p.status === 'delayed').length
  let budgetInitTotal = 0
  let budgetReelTotal = 0
  let engageTotal = 0

  projects.forEach(p => {
    budgetInitTotal += parseDollar(p.investInit)
    budgetReelTotal += parseDollar(p.investReel || p.etatTotal)
    engageTotal += parseDollar(p.etatEnCours)
  })

  const etatTotal = projects.reduce((s, p) => s + parseDollar(p.etatTotal), 0)
  const avgPct = projects.length > 0
    ? Math.round(projects.reduce((s, p) => s + (p.etatPct || 0), 0) / projects.length)
    : 0

  return { total, delayed, budgetInitTotal, budgetReelTotal, engageTotal, etatTotal, avgPct }
}

function fmtM(val) {
  if (val === 0) return '—'
  if (val >= 1) return val.toFixed(1) + ' M$'
  return (val * 1000).toFixed(0) + ' k$'
}

function StatusBadge({ status, color }) {
  const label = { 'on-track': 'En cours', delayed: 'Retard', 'over-budget': 'Depassement' }[status] || status
  const bg = status === 'delayed' ? 'rgba(224,92,92,0.15)' : `rgba(${hexToRgb(color)},0.12)`
  const fg = status === 'delayed' ? '#E05C5C' : color
  return (
    <span
      className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded"
      style={{ background: bg, color: fg }}
    >
      {label}
    </span>
  )
}

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `${r},${g},${b}`
}

function ProjectCard({ project, color, colorRgb, onClick }) {
  return (
    <button
      onClick={onClick}
      className="glass-card p-4 text-left w-full border transition-all duration-200
                 hover:-translate-y-0.5 hover:shadow-lg cursor-pointer"
      style={{ borderColor: `rgba(${colorRgb},0.15)` }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = `rgba(${colorRgb},0.4)` }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = `rgba(${colorRgb},0.15)` }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ background: color, boxShadow: `0 0 8px ${color}` }} />
          <span className="text-sm font-bold text-[var(--text-primary)] line-clamp-1">{project.name}</span>
        </div>
        <StatusBadge status={project.status} color={color} />
      </div>

      {/* Investment row */}
      <div className="flex justify-between mt-3">
        <div>
          <div className="text-[9px] text-[var(--text-muted)] uppercase tracking-wider">Init.</div>
          <div className="text-sm font-bold">{project.investInit}</div>
        </div>
        <div className="text-center">
          <div className="text-[9px] text-[var(--text-muted)] uppercase tracking-wider">Reel</div>
          <div className="text-sm font-bold" style={{ color }}>{project.investReel}</div>
        </div>
        <div className="text-right">
          <div className="text-[9px] text-[var(--text-muted)] uppercase tracking-wider">TRI Init</div>
          <div className="text-sm font-bold" style={{ color: '#4ecdc4' }}>{project.triInit}</div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mt-3">
        <div className="flex justify-between items-center mb-1">
          <span className="text-[9px] text-[var(--text-muted)] uppercase tracking-wider">
            {project.etatEnCours} sur {project.etatTotal}
          </span>
          <span className="text-xs font-bold" style={{ color }}>{project.etatPct}%</span>
        </div>
        <div className="w-full h-1 rounded-full" style={{ background: `rgba(${colorRgb},0.1)` }}>
          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${project.etatPct}%`, background: color }} />
        </div>
      </div>
    </button>
  )
}

function ProjectDetail({ project, color, colorRgb, onClose }) {
  const deltaColor = project.deltaInvest && project.deltaInvest.startsWith('-') ? '#00ab63' : '#f37056'

  return (
    <div className="space-y-4">
      {/* Back button */}
      <button onClick={onClose} className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
        &larr; Retour
      </button>

      <div className="glass-card p-6" style={{ borderColor: `rgba(${colorRgb},0.2)` }}>
        {/* Title */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full" style={{ background: color, boxShadow: `0 0 10px ${color}` }} />
            <h2 className="text-lg font-bold">{project.name}</h2>
          </div>
          <StatusBadge status={project.status} color={color} />
        </div>

        {/* KPI grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div>
            <div className="text-[9px] text-[var(--text-muted)] uppercase tracking-wider mb-1">Invest. Initial</div>
            <div className="text-base font-bold">{project.investInit}</div>
          </div>
          <div>
            <div className="text-[9px] text-[var(--text-muted)] uppercase tracking-wider mb-1">Invest. Reel</div>
            <div className="text-base font-bold" style={{ color }}>{project.investReel}</div>
          </div>
          <div>
            <div className="text-[9px] text-[var(--text-muted)] uppercase tracking-wider mb-1">Delta</div>
            <div className="text-base font-bold" style={{ color: project.deltaInvest === '—' ? 'inherit' : deltaColor }}>{project.deltaInvest}</div>
          </div>
          <div>
            <div className="text-[9px] text-[var(--text-muted)] uppercase tracking-wider mb-1">TRI</div>
            <div className="text-base font-bold" style={{ color: '#4ecdc4' }}>
              {project.triInit}{project.triReel && project.triReel !== '—' ? ` / ${project.triReel}` : ''}
            </div>
          </div>
        </div>

        {/* Progress */}
        <div className="border-t border-[var(--border)] pt-4">
          <div className="text-[9px] text-[var(--text-muted)] uppercase tracking-wider mb-2">
            Etat d'investissement
          </div>
          <div className="text-xs text-[var(--text-muted)] mb-2">{project.etatEnCours} sur {project.etatTotal}</div>
          <div className="w-full h-2 rounded-full mb-2" style={{ background: `rgba(${colorRgb},0.1)` }}>
            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${project.etatPct}%`, background: color }} />
          </div>
          <div className="text-2xl font-extrabold" style={{ color }}>{project.etatPct}%</div>
          <div className="text-[9px] text-[var(--text-muted)]">engage sur budget total</div>
        </div>

        {/* Dates */}
        <div className="border-t border-[var(--border)] pt-4 mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <div className="text-[9px] text-[var(--text-muted)] uppercase tracking-wider mb-1">Debut Init</div>
            <div className="text-sm font-bold">{project.dateDebInit}</div>
          </div>
          <div>
            <div className="text-[9px] text-[var(--text-muted)] uppercase tracking-wider mb-1">Debut Reel</div>
            <div className="text-sm font-bold">{project.dateDebReel}</div>
          </div>
          <div>
            <div className="text-[9px] text-[var(--text-muted)] uppercase tracking-wider mb-1">Fin Init</div>
            <div className="text-sm font-bold">{project.dateFinInit}</div>
          </div>
          <div>
            <div className="text-[9px] text-[var(--text-muted)] uppercase tracking-wider mb-1">Fin Reel</div>
            <div className="text-sm font-bold">{project.dateFinReel}</div>
          </div>
        </div>

        {/* Cash flow mini chart */}
        {project.cfOut && project.cfOut.some(v => v > 0) && (
          <div className="border-t border-[var(--border)] pt-4 mt-4">
            <div className="text-[9px] text-[var(--text-muted)] uppercase tracking-wider mb-2">Cash Flow (6 mois)</div>
            <div className="flex gap-1.5 items-end h-12">
              {['J', 'F', 'M', 'A', 'M', 'J'].map((m, i) => {
                const maxVal = Math.max(...project.cfIn, ...project.cfOut, 1)
                return (
                  <div key={i} className="flex flex-col items-center gap-0.5 flex-1">
                    <div className="flex gap-0.5 items-end h-9">
                      <div
                        className="w-2 rounded-t"
                        style={{
                          background: 'rgba(0,171,99,0.7)',
                          height: `${Math.round((project.cfIn[i] / maxVal) * 100)}%`,
                          minHeight: project.cfIn[i] > 0 ? '2px' : '0',
                        }}
                      />
                      <div
                        className="w-2 rounded-t"
                        style={{
                          background: 'rgba(255,107,107,0.6)',
                          height: `${Math.round((project.cfOut[i] / maxVal) * 100)}%`,
                          minHeight: project.cfOut[i] > 0 ? '2px' : '0',
                        }}
                      />
                    </div>
                    <span className="text-[7px] text-[var(--text-muted)]">{m}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function Capex() {
  const [activeCategory, setActiveCategory] = useState(null)
  const [selectedProject, setSelectedProject] = useState(null)

  // Global KPIs across all categories
  const globalKpis = useMemo(() => {
    let totalProjects = 0
    let totalBudget = 0
    let totalEngage = 0
    let totalDelayed = 0

    Object.values(capexData).forEach(cat => {
      const kpis = computeCategoryKpis(cat)
      totalProjects += kpis.total
      totalBudget += kpis.etatTotal
      totalEngage += kpis.engageTotal
      totalDelayed += kpis.delayed
    })

    const pctEngage = totalBudget > 0 ? Math.round((totalEngage / totalBudget) * 100) : 0
    return { totalProjects, totalBudget, totalEngage, pctEngage, totalDelayed }
  }, [])

  // Active category data
  const activeCat = activeCategory ? capexData[activeCategory] : null
  const activeKpis = activeCat ? computeCategoryKpis(activeCat) : null

  // If showing a project detail
  if (selectedProject && activeCat) {
    return (
      <div className="p-4 md:p-6 max-w-5xl mx-auto">
        <ProjectDetail
          project={selectedProject}
          color={activeCat.color}
          colorRgb={activeCat.colorRgb}
          onClose={() => setSelectedProject(null)}
        />
      </div>
    )
  }

  // If showing a category drill-down
  if (activeCat && activeKpis) {
    const colorRgb = activeCat.colorRgb
    const color = activeCat.color
    return (
      <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-6">
        {/* Back + title */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => setActiveCategory(null)}
            className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
          >
            &larr; CAPEX
          </button>
          <h2 className="text-lg font-bold" style={{ color }}>{activeCat.title}</h2>
        </div>

        {/* Category KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Projets', value: activeKpis.total, color },
            { label: 'En retard', value: activeKpis.delayed, color: activeKpis.delayed > 0 ? '#E05C5C' : color },
            { label: 'Budget total', value: fmtM(activeKpis.etatTotal), color },
            { label: 'Engage moyen', value: activeKpis.avgPct + '%', color: '#4ecdc4' },
          ].map((k, i) => (
            <div key={i} className="glass-card p-4 text-center">
              <div className="text-[9px] text-[var(--text-muted)] uppercase tracking-wider mb-1">{k.label}</div>
              <div className="text-xl font-extrabold" style={{ color: k.color }}>{k.value}</div>
            </div>
          ))}
        </div>

        {/* Project cards grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {activeCat.projects.map(p => (
            <ProjectCard
              key={p.id}
              project={p}
              color={color}
              colorRgb={colorRgb}
              onClick={() => setSelectedProject(p)}
            />
          ))}
        </div>
      </div>
    )
  }

  // Landing: overview of all categories
  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-xl font-bold" style={{ color: ACCENT }}>CAPEX</h1>
        <p className="text-xs text-[var(--text-muted)] mt-1">Suivi des investissements par categorie</p>
      </div>

      {/* Global KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total projets', value: globalKpis.totalProjects },
          { label: 'Budget total', value: fmtM(globalKpis.totalBudget) },
          { label: 'Engage', value: globalKpis.pctEngage + '%', color: '#4ecdc4' },
          { label: 'En retard', value: globalKpis.totalDelayed, color: globalKpis.totalDelayed > 0 ? '#E05C5C' : ACCENT },
        ].map((k, i) => (
          <div key={i} className="glass-card p-4 text-center">
            <div className="text-[9px] text-[var(--text-muted)] uppercase tracking-wider mb-1">{k.label}</div>
            <div className="text-2xl font-extrabold" style={{ color: k.color || ACCENT }}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* Category cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {CATEGORIES.map(cat => {
          const data = capexData[cat.key]
          if (!data) return null
          const kpis = computeCategoryKpis(data)
          const colorRgb = data.colorRgb
          const color = data.color
          return (
            <button
              key={cat.key}
              onClick={() => setActiveCategory(cat.key)}
              className="glass-card p-5 text-left cursor-pointer border transition-all duration-200
                         hover:-translate-y-1 hover:shadow-lg relative overflow-hidden"
              style={{ borderColor: `rgba(${colorRgb},0.15)` }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = `rgba(${colorRgb},0.4)` }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = `rgba(${colorRgb},0.15)` }}
            >
              {/* Accent top bar */}
              <div className="absolute top-0 left-0 right-0 h-[3px]" style={{ background: color }} />

              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold" style={{ color }}>{data.title}</h3>
                <span className="text-xs text-[var(--text-muted)]">{kpis.total} projets</span>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <div className="text-[9px] text-[var(--text-muted)] uppercase tracking-wider">Budget</div>
                  <div className="text-base font-extrabold" style={{ color }}>{fmtM(kpis.etatTotal)}</div>
                </div>
                <div className="text-center">
                  <div className="text-[9px] text-[var(--text-muted)] uppercase tracking-wider">Engage</div>
                  <div className="text-base font-extrabold" style={{ color: '#4ecdc4' }}>{kpis.avgPct}%</div>
                </div>
                <div className="text-right">
                  <div className="text-[9px] text-[var(--text-muted)] uppercase tracking-wider">Retard</div>
                  <div className="text-base font-extrabold" style={{ color: kpis.delayed > 0 ? '#E05C5C' : 'rgba(255,255,255,0.3)' }}>
                    {kpis.delayed}
                  </div>
                </div>
              </div>

              {/* Mini progress */}
              <div className="mt-3 w-full h-1 rounded-full" style={{ background: `rgba(${colorRgb},0.1)` }}>
                <div className="h-full rounded-full" style={{ width: `${kpis.avgPct}%`, background: color }} />
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
