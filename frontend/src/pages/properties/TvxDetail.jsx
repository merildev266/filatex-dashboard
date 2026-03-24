import { useState, useMemo } from 'react'
import { propsData_tvx } from '../../data/props_data'
import KpiBox from '../../components/KpiBox'
import StatusBadge from '../../components/StatusBadge'

const PROPS = '#FDB823'
const RED = '#E05C5C'
const VERT = '#00ab63'

function getTimingStatus(t) {
  if (t === 'Delay' || t === 'delay') return 'delay'
  return 'en_cours'
}

function getTimingColor(t) {
  if (t === 'Delay' || t === 'delay') return RED
  return VERT
}

export default function TvxDetail() {
  const [filter, setFilter] = useState('all')
  const [selectedProject, setSelectedProject] = useState(null)

  const projects = propsData_tvx || []

  const kpis = useMemo(() => {
    const total = projects.length
    const delayed = projects.filter(p => p.timing_var === 'Delay' || p.timing_var === 'delay').length
    const onTime = total - delayed
    // Count by budget status
    const overrun = projects.filter(p => p.budget_var && p.budget_var !== 'No overrun').length
    return { total, delayed, onTime, overrun }
  }, [projects])

  const filtered = useMemo(() => {
    if (filter === 'ontime') return projects.filter(p => p.timing_var !== 'Delay' && p.timing_var !== 'delay')
    if (filter === 'delay') return projects.filter(p => p.timing_var === 'Delay' || p.timing_var === 'delay')
    return projects
  }, [projects, filter])

  return (
    <div>
      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="glass-card p-4" style={{ borderColor: `${PROPS}25` }}>
          <KpiBox value={kpis.total} label="Projets" color={PROPS} />
        </div>
        <div className="glass-card p-4" style={{ borderColor: `${VERT}25` }}>
          <KpiBox value={kpis.onTime} label="On Time" color={VERT} />
        </div>
        <div className="glass-card p-4" style={{ borderColor: `${RED}25` }}>
          <KpiBox value={kpis.delayed} label="En retard" color={RED} />
        </div>
        <div className="glass-card p-4" style={{ borderColor: `${RED}25` }}>
          <KpiBox value={kpis.overrun} label="Depassement budget" color={kpis.overrun > 0 ? RED : VERT} />
        </div>
      </div>

      {/* Alert banner */}
      {kpis.delayed > 0 && (
        <div className="mb-4 p-3 rounded-xl bg-[rgba(224,92,92,0.08)] border border-[rgba(224,92,92,0.15)]
                        flex items-center gap-2 flex-wrap">
          <span className="text-[11px] font-bold text-[#E05C5C]">&#9888; {kpis.delayed} projet{kpis.delayed > 1 ? 's' : ''} en retard</span>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-2 mb-4">
        {[
          { key: 'all', label: `Tous (${projects.length})` },
          { key: 'ontime', label: 'On Time' },
          { key: 'delay', label: 'En retard' },
        ].map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider
                        border transition-colors cursor-pointer
                        ${filter === f.key
                          ? 'bg-[rgba(253,184,35,0.2)] border-[rgba(253,184,35,0.4)] text-white'
                          : 'bg-transparent border-[var(--border)] text-[var(--text-muted)] hover:border-[rgba(253,184,35,0.3)]'
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
            style={{ borderColor: `${PROPS}20` }}
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

            <div className="text-[10px] text-[var(--text-dim)] line-clamp-2 mb-2">
              {p.etape}
            </div>

            <div className="flex gap-2 flex-wrap">
              <span className="text-[9px] px-2 py-0.5 rounded"
                style={{
                  background: getTimingColor(p.timing_var) + '15',
                  color: getTimingColor(p.timing_var)
                }}>
                {p.timing_var}
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
            className="glass-card p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto"
            style={{ borderColor: `${PROPS}30` }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold" style={{ color: PROPS }}>
                {selectedProject.site}
              </h2>
              <button
                onClick={() => setSelectedProject(null)}
                className="text-[var(--text-muted)] hover:text-white text-lg bg-transparent border-none cursor-pointer"
              >
                &#10005;
              </button>
            </div>

            <div className="space-y-3">
              {selectedProject.site && (
                <div className="text-[10px]">
                  <span className="text-[var(--text-dim)]">Site: </span>
                  <span className="font-bold text-white/80">{selectedProject.site}</span>
                </div>
              )}
              <div className="text-[10px]">
                <span className="text-[var(--text-dim)]">Responsable: </span>
                <span className="font-bold text-white/80">{selectedProject.resp || 'N/A'}</span>
              </div>
              <div className="text-[10px]">
                <span className="text-[var(--text-dim)]">Timing: </span>
                <span className="font-bold" style={{ color: getTimingColor(selectedProject.timing_var) }}>
                  {selectedProject.timing_var}
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

              <div className="p-3 rounded-lg bg-[rgba(253,184,35,0.06)] border border-[rgba(253,184,35,0.12)]">
                <div className="text-[9px] font-bold uppercase tracking-wider text-[var(--text-dim)] mb-1">
                  Etape en cours
                </div>
                <div className="text-[11px] text-white/80">{selectedProject.etape}</div>
              </div>

              {selectedProject.latest_comment && (
                <div className="p-3 rounded-lg bg-[rgba(253,184,35,0.04)] border border-[rgba(253,184,35,0.1)]">
                  <div className="text-[9px] font-bold uppercase tracking-wider text-[var(--text-dim)] mb-1">
                    Dernier commentaire
                  </div>
                  <div className="text-[10px] text-white/60">{selectedProject.latest_comment}</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
