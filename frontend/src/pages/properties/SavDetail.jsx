import { useState, useMemo } from 'react'
import { propsData_sav } from '../../data/props_data'

const TEAL = '#5aafaf'
const RED = '#E05C5C'
const VERT = '#00ab63'
const YELLOW = '#FDB823'

function getTimingColor(t) {
  if (!t) return 'rgba(255,255,255,0.4)'
  const lower = t.toLowerCase()
  if (lower.includes('delay') && lower.includes('>=30')) return RED
  if (lower.includes('delay')) return YELLOW
  return VERT
}

function getTimingLabel(t) {
  if (!t) return 'N/A'
  const lower = t.toLowerCase()
  if (lower.includes('delay') && lower.includes('>=30')) return 'Retard >=30j'
  if (lower.includes('delay')) return 'Retard <30j'
  if (lower.includes('on time')) return 'On Time'
  return t
}

function getStatusColor(s) {
  if (!s) return 'rgba(255,255,255,0.4)'
  const lower = s.toLowerCase()
  if (lower.includes('termin')) return VERT
  if (lower.includes('en cours') || lower.includes('travaux')) return TEAL
  return 'rgba(255,255,255,0.4)'
}

export default function SavDetail() {
  const [filter, setFilter] = useState('all')
  const [selectedProject, setSelectedProject] = useState(null)

  const projects = propsData_sav || []

  const kpis = useMemo(() => {
    const total = projects.length
    const delayed = projects.filter(p => p.timing_var && p.timing_var.toLowerCase().includes('delay')).length
    const onTime = total - delayed
    const mgmtRequired = projects.filter(p =>
      p.status_cps && p.status_cps.toLowerCase().includes('management')
    ).length
    return { total, delayed, onTime, mgmtRequired }
  }, [projects])

  const filtered = useMemo(() => {
    if (filter === 'ontime') return projects.filter(p => !p.timing_var || !p.timing_var.toLowerCase().includes('delay'))
    if (filter === 'delay') return projects.filter(p => p.timing_var && p.timing_var.toLowerCase().includes('delay'))
    if (filter === 'mgmt') return projects.filter(p =>
      p.status_cps && p.status_cps.toLowerCase().includes('management'))
    return projects
  }, [projects, filter])

  return (
    <div>
      {/* KPIs */}
      <div className="props-kpi-row-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 16 }}>
        <div className="props-kpi-card" style={{ borderColor: 'rgba(90,175,175,0.15)' }}>
          <div className="props-kpi-label">Projets SAV</div>
          <div className="props-kpi-val" style={{ color: TEAL }}>{kpis.total}</div>
          <div className="props-kpi-sub">Total</div>
        </div>
        <div className="props-kpi-card" style={{ borderColor: 'rgba(0,171,99,0.15)' }}>
          <div className="props-kpi-label">On Time</div>
          <div className="props-kpi-val" style={{ color: VERT }}>{kpis.onTime}</div>
          <div className="props-kpi-sub">Dans les temps</div>
        </div>
        <div className="props-kpi-card" style={{ borderColor: 'rgba(224,92,92,0.15)' }}>
          <div className="props-kpi-label">En retard</div>
          <div className="props-kpi-val" style={{ color: kpis.delayed > 0 ? RED : VERT }}>{kpis.delayed}</div>
          <div className="props-kpi-sub">Projets en retard</div>
        </div>
        <div className="props-kpi-card" style={{ borderColor: 'rgba(90,175,175,0.15)' }}>
          <div className="props-kpi-label">Decision requise</div>
          <div className="props-kpi-val" style={{ color: TEAL }}>{kpis.mgmtRequired}</div>
          <div className="props-kpi-sub">Management</div>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {[
          { key: 'all', label: `Tous (${projects.length})` },
          { key: 'ontime', label: 'On Time' },
          { key: 'delay', label: 'En retard' },
          { key: 'mgmt', label: 'Decision requise' },
        ].map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            style={{
              padding: '6px 12px', borderRadius: 8, fontSize: 10, fontWeight: 700,
              textTransform: 'uppercase', letterSpacing: '0.1em', cursor: 'pointer',
              border: `1px solid ${filter === f.key ? 'rgba(90,175,175,0.4)' : 'rgba(255,255,255,0.1)'}`,
              background: filter === f.key ? 'rgba(90,175,175,0.2)' : 'transparent',
              color: filter === f.key ? '#fff' : 'rgba(255,255,255,0.5)',
              transition: 'all 0.2s'
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Project cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 12 }}>
        {filtered.map((p, i) => {
          const timingColor = getTimingColor(p.timing_var)
          const isMgmt = p.status_cps && p.status_cps.toLowerCase().includes('management')
          return (
            <div
              key={i}
              onClick={() => setSelectedProject(p)}
              className="unified-card clickable-props"
              style={{ padding: 16 }}
            >
              {/* Name + badges */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{p.site}</div>
                  {p.resp && (
                    <div style={{ fontSize: 9, color: 'var(--text-dim)', marginTop: 2 }}>Resp: {p.resp}</div>
                  )}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                  <span style={{
                    fontSize: 9, fontWeight: 700, color: 'var(--text)',
                    background: timingColor + '15', padding: '2px 6px', borderRadius: 4
                  }}>{getTimingLabel(p.timing_var)}</span>
                  <span style={{
                    fontSize: 9, fontWeight: 600, color: 'var(--text)',
                    background: getStatusColor(p.status) + '15', padding: '2px 6px', borderRadius: 4
                  }}>{p.status || 'N/A'}</span>
                </div>
              </div>

              {/* Current step */}
              <div style={{
                fontSize: 10, color: 'var(--text-muted)',
                overflow: 'hidden', textOverflow: 'ellipsis',
                display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                marginBottom: 6
              }}>
                {p.etape}
              </div>

              {p.interlocuteur && (
                <div style={{ fontSize: 9, color: 'var(--text-dim)' }}>
                  Interlocuteur: <span style={{ color: 'var(--text-muted)' }}>{p.interlocuteur}</span>
                </div>
              )}

              {isMgmt && (
                <div style={{
                  marginTop: 8, fontSize: 9, fontWeight: 700,
                  display: 'inline-block', padding: '2px 8px', borderRadius: 4,
                  background: `${TEAL}15`, color: 'var(--text)'
                }}>
                  Decision management requise
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Detail modal */}
      {selectedProject && (
        <>
          <div
            style={{ position: 'fixed', inset: 0, background: 'var(--overlay-bg)', zIndex: 99 }}
            onClick={() => setSelectedProject(null)}
          />
          <div style={{
            position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
            background: 'var(--card)', border: '1px solid var(--card-border)',
            borderRadius: 16, padding: 24, maxWidth: 500, width: '90%',
            maxHeight: '80vh', overflowY: 'auto', zIndex: 100
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <span style={{ fontSize: 16, fontWeight: 800, color: 'var(--text)' }}>{selectedProject.site}</span>
              <button onClick={() => setSelectedProject(null)} style={{
                background: 'transparent', border: 'none', color: 'var(--text-muted)',
                fontSize: 18, cursor: 'pointer'
              }}>&times;</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
              {[
                { label: 'Responsable', value: selectedProject.resp || 'N/A' },
                { label: 'Interlocuteur', value: selectedProject.interlocuteur || 'N/A' },
                { label: 'Timing', value: getTimingLabel(selectedProject.timing_var), color: getTimingColor(selectedProject.timing_var) },
                { label: 'Budget', value: selectedProject.budget_var || 'N/A' },
              ].map((item, i) => (
                <div key={i} style={{ fontSize: 10 }}>
                  <span style={{ color: 'var(--text-dim)' }}>{item.label}: </span>
                  <span style={{ fontWeight: 700, color: item.color || 'rgba(255,255,255,0.8)' }}>{item.value}</span>
                </div>
              ))}
            </div>

            <div style={{ fontSize: 10, marginBottom: 12 }}>
              <span style={{ color: 'var(--text-dim)' }}>Statut: </span>
              <span style={{ fontWeight: 700, color: 'var(--text-secondary)' }}>{selectedProject.status || 'N/A'}</span>
            </div>
            <div style={{ fontSize: 10, marginBottom: 12 }}>
              <span style={{ color: 'var(--text-dim)' }}>CPs: </span>
              <span style={{ fontWeight: 700, color: 'var(--text-secondary)' }}>{selectedProject.status_cps || 'N/A'}</span>
            </div>

            <div style={{
              padding: '10px 14px', borderRadius: 8,
              background: 'var(--card)', border: '1px solid var(--card-border)',
              marginBottom: 12
            }}>
              <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--text-dim)', marginBottom: 4 }}>Etape en cours</div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{selectedProject.etape}</div>
            </div>

            {selectedProject.latest_comment && (
              <div style={{
                padding: '10px 14px', borderRadius: 8,
                background: 'var(--inner-card)', border: '1px solid var(--inner-card-border)'
              }}>
                <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--text-dim)', marginBottom: 4 }}>
                  Dernier commentaire ({selectedProject.latest_week})
                </div>
                <div style={{ fontSize: 10, color: 'var(--text-secondary)' }}>{selectedProject.latest_comment}</div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
