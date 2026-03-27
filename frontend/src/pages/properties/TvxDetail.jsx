import { useState, useMemo } from 'react'
import { propsData_tvx } from '../../data/props_data'

const PROPS = '#FDB823'
const RED = '#E05C5C'
const VERT = '#00ab63'
const TEAL = '#5aafaf'

function getTimingColor(t) {
  if (!t) return 'rgba(255,255,255,0.4)'
  const lower = t.toLowerCase()
  if (lower.includes('delay') && lower.includes('>=30')) return RED
  if (lower.includes('delay')) return '#FDB823'
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
  if (lower.includes('pas encore') || lower.includes('non')) return 'rgba(255,255,255,0.35)'
  return 'rgba(255,255,255,0.5)'
}

export default function TvxDetail() {
  const [filter, setFilter] = useState('all')
  const [selectedProject, setSelectedProject] = useState(null)

  const projects = propsData_tvx || []

  const kpis = useMemo(() => {
    const total = projects.length
    const delayed = projects.filter(p => p.timing_var && p.timing_var.toLowerCase().includes('delay')).length
    const onTime = total - delayed
    const overrun = projects.filter(p => p.budget_var && p.budget_var !== 'No overrun').length
    return { total, delayed, onTime, overrun }
  }, [projects])

  const filtered = useMemo(() => {
    if (filter === 'ontime') return projects.filter(p => !p.timing_var || !p.timing_var.toLowerCase().includes('delay'))
    if (filter === 'delay') return projects.filter(p => p.timing_var && p.timing_var.toLowerCase().includes('delay'))
    return projects
  }, [projects, filter])

  return (
    <div>
      {/* KPIs */}
      <div className="props-kpi-row-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 16 }}>
        <div className="props-kpi-card" style={{ borderColor: 'rgba(253,184,35,0.15)' }}>
          <div className="props-kpi-label">Projets Travaux</div>
          <div className="props-kpi-val" style={{ color: PROPS }}>{kpis.total}</div>
          <div className="props-kpi-sub">Total en cours</div>
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
        <div className="props-kpi-card" style={{ borderColor: 'rgba(224,92,92,0.15)' }}>
          <div className="props-kpi-label">Depassement budget</div>
          <div className="props-kpi-val" style={{ color: kpis.overrun > 0 ? RED : VERT }}>{kpis.overrun}</div>
          <div className="props-kpi-sub">Hors budget</div>
        </div>
      </div>

      {/* Alert banner */}
      {kpis.delayed > 0 && (
        <div style={{
          marginBottom: 16, padding: '10px 16px', borderRadius: 10,
          background: 'var(--card)', border: '1px solid var(--card-border)',
          display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap'
        }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: RED }}>&#9888; {kpis.delayed} projet{kpis.delayed > 1 ? 's' : ''} en retard</span>
        </div>
      )}

      {/* Filters */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {[
          { key: 'all', label: `Tous (${projects.length})` },
          { key: 'ontime', label: 'On Time' },
          { key: 'delay', label: 'En retard' },
        ].map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            style={{
              padding: '6px 12px', borderRadius: 8, fontSize: 10, fontWeight: 700,
              textTransform: 'uppercase', letterSpacing: '0.1em', cursor: 'pointer',
              border: `1px solid ${filter === f.key ? 'rgba(253,184,35,0.4)' : 'rgba(255,255,255,0.1)'}`,
              background: filter === f.key ? 'rgba(253,184,35,0.2)' : 'transparent',
              color: filter === f.key ? '#fff' : 'rgba(255,255,255,0.5)',
              transition: 'all 0.2s'
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Project cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 12 }}>
        {filtered.map((p, i) => {
          const timingColor = getTimingColor(p.timing_var)
          return (
            <div
              key={i}
              onClick={() => setSelectedProject(p)}
              style={{
                background: 'var(--card)',
                border: '1px solid var(--card-border)',
                borderRadius: 12, padding: 16, cursor: 'pointer',
                transition: 'border-color 0.2s, transform 0.15s'
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(253,184,35,0.35)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = ''; e.currentTarget.style.transform = 'none' }}
            >
              {/* Name + status */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{p.site}</div>
                <span style={{
                  fontSize: 9, fontWeight: 700, color: timingColor,
                  background: timingColor + '15', padding: '3px 8px', borderRadius: 6
                }}>{getTimingLabel(p.timing_var)}</span>
              </div>

              {/* Resp */}
              {p.resp && (
                <div style={{ fontSize: 10, color: 'var(--text-dim)', marginBottom: 6 }}>
                  Resp: <span style={{ fontWeight: 600, color: 'var(--text-muted)' }}>{p.resp}</span>
                </div>
              )}

              {/* Current step */}
              <div style={{
                fontSize: 10, color: 'var(--text-muted)',
                overflow: 'hidden', textOverflow: 'ellipsis',
                display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                marginBottom: 8
              }}>
                {p.etape}
              </div>

              {/* Badges */}
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <span style={{
                  fontSize: 9, padding: '2px 6px', borderRadius: 4,
                  background: p.budget_var === 'No overrun' ? `${VERT}15` : `${RED}15`,
                  color: p.budget_var === 'No overrun' ? VERT : RED
                }}>
                  {p.budget_var || 'N/A'}
                </span>
                <span style={{
                  fontSize: 9, padding: '2px 6px', borderRadius: 4,
                  background: getStatusColor(p.status) + '15',
                  color: getStatusColor(p.status)
                }}>
                  {p.status || 'N/A'}
                </span>
              </div>
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
              <span style={{ fontSize: 16, fontWeight: 800, color: PROPS }}>{selectedProject.site}</span>
              <button onClick={() => setSelectedProject(null)} style={{
                background: 'transparent', border: 'none', color: 'var(--text-muted)',
                fontSize: 18, cursor: 'pointer'
              }}>&times;</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
              {[
                { label: 'Responsable', value: selectedProject.resp || 'N/A' },
                { label: 'Timing', value: getTimingLabel(selectedProject.timing_var), color: getTimingColor(selectedProject.timing_var) },
                { label: 'Budget', value: selectedProject.budget_var || 'N/A' },
                { label: 'CPs', value: selectedProject.status_cps || 'N/A' },
              ].map((item, i) => (
                <div key={i} style={{ fontSize: 10 }}>
                  <span style={{ color: 'var(--text-dim)' }}>{item.label}: </span>
                  <span style={{ fontWeight: 700, color: item.color || 'rgba(255,255,255,0.8)' }}>{item.value}</span>
                </div>
              ))}
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
