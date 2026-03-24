import { useState, useMemo } from 'react'
import { propsData_sav } from '../../data/props_data'
import KpiBox from '../../components/KpiBox'
import StatusBadge from '../../components/StatusBadge'

const TEAL = '#5aafaf'
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

function getStatusLabel(s) {
  if (!s) return 'indefini'
  const lower = s.toLowerCase()
  if (lower.includes('termin')) return 'termine'
  if (lower.includes('en cours') || lower.includes('started')) return 'en_cours'
  if (lower.includes('non')) return 'non_demarre'
  return 'indefini'
}

export default function SavDetail() {
  const [filter, setFilter] = useState('all')
  const [selectedProject, setSelectedProject] = useState(null)

  const projects = propsData_sav || []

  const kpis = useMemo(() => {
    const total = projects.length
    const delayed = projects.filter(p => p.timing_var === 'Delay' || p.timing_var === 'delay').length
    const onTime = total - delayed
    const mgmtRequired = projects.filter(p =>
      p.status_cps && p.status_cps.toLowerCase().includes('management')
    ).length
    return { total, delayed, onTime, mgmtRequired }
  }, [projects])

  const filtered = useMemo(() => {
    if (filter === 'ontime') return projects.filter(p => p.timing_var !== 'Delay' && p.timing_var !== 'delay')
    if (filter === 'delay') return projects.filter(p => p.timing_var === 'Delay' || p.timing_var === 'delay')
    if (filter === 'mgmt') return projects.filter(p =>
      p.status_cps && p.status_cps.toLowerCase().includes('management'))
    return projects
  }, [projects, filter])

  return (
    <div>
      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="glass-card p-4" style={{ borderColor: `${TEAL}25` }}>
          <KpiBox value={kpis.total} label="Projets SAV" color={TEAL} />
        </div>
        <div className="glass-card p-4" style={{ borderColor: `${VERT}25` }}>
          <KpiBox value={kpis.onTime} label="On Time" color={VERT} />
        </div>
        <div className="glass-card p-4" style={{ borderColor: `${RED}25` }}>
          <KpiBox value={kpis.delayed} label="En retard" color={RED} />
        </div>
        <div className="glass-card p-4" style={{ borderColor: `${TEAL}25` }}>
          <KpiBox value={kpis.mgmtRequired} label="Decision requise" color={TEAL} />
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {[
          { key: 'all', label: `Tous (${projects.length})` },
          { key: 'ontime', label: 'On Time' },
          { key: 'delay', label: 'En retard' },
          { key: 'mgmt', label: 'Decision requise' },
        ].map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider
                        border transition-colors cursor-pointer
                        ${filter === f.key
                          ? 'bg-[rgba(90,175,175,0.2)] border-[rgba(90,175,175,0.4)] text-white'
                          : 'bg-transparent border-[var(--border)] text-[var(--text-muted)] hover:border-[rgba(90,175,175,0.3)]'
                        }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Project list */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((p, i) => (
          <div
            key={i}
            onClick={() => setSelectedProject(p)}
            className="glass-card p-4 cursor-pointer hover:-translate-y-1 transition-transform"
            style={{ borderColor: `${TEAL}20` }}
          >
            <div className="flex items-start justify-between gap-2 mb-2">
              <div>
                <h3 className="text-[13px] font-bold">{p.site}</h3>
                {p.resp && (
                  <div className="text-[9px] text-[var(--text-dim)]">Resp: {p.resp}</div>
                )}
              </div>
              <div className="flex flex-col items-end gap-1">
                <StatusBadge status={getTimingStatus(p.timing_var)} />
                <StatusBadge status={getStatusLabel(p.status)} />
              </div>
            </div>

            <div className="text-[10px] text-[var(--text-dim)] line-clamp-2 mb-2">
              {p.etape}
            </div>

            {p.interlocuteur && (
              <div className="text-[9px] text-[var(--text-muted)]">
                Interlocuteur: <span className="text-white/60">{p.interlocuteur}</span>
              </div>
            )}

            {p.status_cps && p.status_cps.toLowerCase().includes('management') && (
              <div className="mt-2 text-[9px] font-bold px-2 py-0.5 rounded inline-block"
                style={{ background: `${TEAL}15`, color: TEAL }}>
                Decision management requise
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Detail modal */}
      {selectedProject && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={() => setSelectedProject(null)}
        >
          <div
            className="glass-card p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto"
            style={{ borderColor: `${TEAL}30` }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold" style={{ color: TEAL }}>
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
              <div className="grid grid-cols-2 gap-3">
                <div className="text-[10px]">
                  <span className="text-[var(--text-dim)]">Responsable: </span>
                  <span className="font-bold text-white/80">{selectedProject.resp || 'N/A'}</span>
                </div>
                <div className="text-[10px]">
                  <span className="text-[var(--text-dim)]">Interlocuteur: </span>
                  <span className="font-bold text-white/80">{selectedProject.interlocuteur || 'N/A'}</span>
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
              </div>

              <div className="text-[10px]">
                <span className="text-[var(--text-dim)]">Statut: </span>
                <span className="font-bold text-white/80">{selectedProject.status || 'N/A'}</span>
              </div>

              <div className="text-[10px]">
                <span className="text-[var(--text-dim)]">CPs: </span>
                <span className="font-bold text-white/80">{selectedProject.status_cps || 'N/A'}</span>
              </div>

              <div className="p-3 rounded-lg bg-[rgba(90,175,175,0.06)] border border-[rgba(90,175,175,0.12)]">
                <div className="text-[9px] font-bold uppercase tracking-wider text-[var(--text-dim)] mb-1">
                  Etape en cours
                </div>
                <div className="text-[11px] text-white/80">{selectedProject.etape}</div>
              </div>

              {selectedProject.latest_comment && (
                <div className="p-3 rounded-lg bg-[rgba(90,175,175,0.04)] border border-[rgba(90,175,175,0.1)]">
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
