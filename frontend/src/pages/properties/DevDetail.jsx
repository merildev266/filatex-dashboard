import { useState, useMemo } from 'react'
import { propsData_dev } from '../../data/props_data'
import { propsData_dev_full } from '../../data/props_data_dev_full'
import StatusBadge from '../../components/StatusBadge'
import KpiBox from '../../components/KpiBox'

const AZUR = '#426ab3'
const RED = '#E05C5C'
const VERT = '#00ab63'

function getTimingStatus(t) {
  if (t === 'Delay' || t === 'delay') return 'delay'
  return 'en_cours'
}

function getTimingLabel(t) {
  if (t === 'Delay' || t === 'delay') return 'En retard'
  return 'On Time'
}

function getTimingColor(t) {
  if (t === 'Delay' || t === 'delay') return RED
  return VERT
}

export default function DevDetail() {
  const [selectedProject, setSelectedProject] = useState(null)
  const [filter, setFilter] = useState('all') // all | ontime | delay

  const projects = propsData_dev || []
  const projectsFull = propsData_dev_full || []

  const kpis = useMemo(() => {
    const total = projects.length
    const delayed = projects.filter(p => p.timing_var === 'Delay' || p.timing_var === 'delay').length
    const onTime = total - delayed
    return { total, delayed, onTime }
  }, [projects])

  const filtered = useMemo(() => {
    if (filter === 'ontime') return projects.filter(p => p.timing_var !== 'Delay' && p.timing_var !== 'delay')
    if (filter === 'delay') return projects.filter(p => p.timing_var === 'Delay' || p.timing_var === 'delay')
    return projects
  }, [projects, filter])

  // Find full data for selected project
  const fullData = useMemo(() => {
    if (!selectedProject) return null
    return projectsFull.find(p => p.name.toLowerCase() === selectedProject.site?.toLowerCase())
  }, [selectedProject, projectsFull])

  return (
    <div>
      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="glass-card p-4" style={{ borderColor: `${AZUR}25` }}>
          <KpiBox value={kpis.total} label="Projets" color={AZUR} />
        </div>
        <div className="glass-card p-4" style={{ borderColor: `${VERT}25` }}>
          <KpiBox value={kpis.onTime} label="On Time" color={VERT} />
        </div>
        <div className="glass-card p-4" style={{ borderColor: `${RED}25` }}>
          <KpiBox value={kpis.delayed} label="En retard" color={RED} />
        </div>
      </div>

      {/* Alert banner */}
      {kpis.delayed > 0 && (
        <div className="mb-4 p-3 rounded-xl bg-[rgba(224,92,92,0.08)] border border-[rgba(224,92,92,0.15)]
                        flex items-center gap-2 flex-wrap">
          <span className="text-[11px] font-bold text-[#E05C5C]">&#9888; Projets en retard :</span>
          {projects.filter(p => p.timing_var === 'Delay' || p.timing_var === 'delay').map((p, i) => (
            <span key={i} className="text-[10px] text-[#E05C5C] bg-[rgba(224,92,92,0.1)] px-2 py-0.5 rounded-md">
              {p.site}
            </span>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-2 mb-4">
        {[
          { key: 'all', label: 'Tous' },
          { key: 'ontime', label: 'On Time' },
          { key: 'delay', label: 'En retard' },
        ].map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider
                        border transition-colors cursor-pointer
                        ${filter === f.key
                          ? 'bg-[rgba(66,106,179,0.2)] border-[rgba(66,106,179,0.4)] text-white'
                          : 'bg-transparent border-[var(--border)] text-[var(--text-muted)] hover:border-[rgba(66,106,179,0.3)]'
                        }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Project list */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((p, i) => (
          <div
            key={i}
            onClick={() => setSelectedProject(p)}
            className="glass-card p-4 cursor-pointer hover:-translate-y-1 transition-transform"
            style={{ borderColor: `${AZUR}20` }}
          >
            <div className="flex items-start justify-between gap-2 mb-2">
              <div>
                <h3 className="text-[13px] font-bold">{p.site}</h3>
              </div>
              <StatusBadge status={getTimingStatus(p.timing_var)} />
            </div>

            {p.resp && (
              <div className="text-[10px] text-[var(--text-muted)] mb-2">
                Resp: <span className="font-semibold text-white/70">{p.resp}</span>
              </div>
            )}

            <div className="text-[10px] text-[var(--text-dim)] mb-1">
              {p.etape}
            </div>

            <div className="flex gap-2 mt-2 flex-wrap">
              <span className="text-[9px] px-2 py-0.5 rounded"
                style={{
                  background: getTimingColor(p.timing_var) + '15',
                  color: getTimingColor(p.timing_var)
                }}>
                {getTimingLabel(p.timing_var)}
              </span>
              <span className="text-[9px] px-2 py-0.5 rounded"
                style={{
                  background: p.budget_var === 'No overrun' ? `${VERT}15` : `${RED}15`,
                  color: p.budget_var === 'No overrun' ? VERT : RED
                }}>
                {p.budget_var || 'N/A'}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Project detail modal */}
      {selectedProject && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={() => setSelectedProject(null)}
        >
          <div
            className="glass-card p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
            style={{ borderColor: `${AZUR}30` }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold" style={{ color: AZUR }}>
                {selectedProject.site}
              </h2>
              <button
                onClick={() => setSelectedProject(null)}
                className="text-[var(--text-muted)] hover:text-white text-lg bg-transparent border-none cursor-pointer"
              >
                &#10005;
              </button>
            </div>

            {/* Project info */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="text-[10px]">
                <span className="text-[var(--text-dim)]">Responsable: </span>
                <span className="font-bold text-white/80">{selectedProject.resp || 'N/A'}</span>
              </div>
              <div className="text-[10px]">
                <span className="text-[var(--text-dim)]">Timing: </span>
                <span className="font-bold" style={{ color: getTimingColor(selectedProject.timing_var) }}>
                  {getTimingLabel(selectedProject.timing_var)}
                </span>
              </div>
              <div className="text-[10px]">
                <span className="text-[var(--text-dim)]">Budget: </span>
                <span className="font-bold text-white/80">{selectedProject.budget_var || 'N/A'}</span>
              </div>
              <div className="text-[10px]">
                <span className="text-[var(--text-dim)]">CPs: </span>
                <span className="font-bold text-white/80">{selectedProject.status_cps || 'N/A'}</span>
              </div>
            </div>

            {/* Etape */}
            <div className="p-3 rounded-lg bg-[rgba(66,106,179,0.06)] border border-[rgba(66,106,179,0.12)] mb-4">
              <div className="text-[9px] font-bold uppercase tracking-wider text-[var(--text-dim)] mb-1">
                Etape en cours
              </div>
              <div className="text-[11px] text-white/80">{selectedProject.etape}</div>
            </div>

            {/* Full data steps if available */}
            {fullData && fullData.etapes && (
              <div>
                <div className="text-[9px] font-bold uppercase tracking-wider text-[var(--text-dim)] mb-3">
                  Historique des etapes
                </div>
                <div className="space-y-3">
                  {fullData.etapes.map((step, si) => (
                    <div key={si} className="p-3 rounded-lg bg-[rgba(66,106,179,0.04)] border border-[rgba(66,106,179,0.1)]">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <span className="text-[11px] font-bold text-white/80">{step.etape}</span>
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded"
                          style={{
                            background: getTimingColor(step.timing_var) + '15',
                            color: getTimingColor(step.timing_var)
                          }}>
                          {step.timing_var}
                        </span>
                      </div>
                      <div className="text-[9px] text-[var(--text-dim)] mb-1">
                        Resp: {step.resp} | Budget: {step.budget_var} | CPs: {step.status_cps}
                      </div>
                      {step.history && step.history.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {step.history.slice(-3).map((h, hi) => (
                            <div key={hi} className="text-[9px] text-white/50 pl-2 border-l border-[rgba(66,106,179,0.2)]">
                              <span className="font-bold text-white/40">{h.week}:</span> {h.comment}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
