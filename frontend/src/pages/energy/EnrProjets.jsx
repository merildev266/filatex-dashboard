import { useState, useMemo } from 'react'
import { ENR_PROJECTS_DATA } from '../../data/enr_projects_data'

const PHASE_LABELS = { termine: 'Termin\u00e9', construction: 'En construction', developpement: 'D\u00e9veloppement', planifie: 'Planifi\u00e9' }
const PHASE_COLORS = { termine: '#00ab63', construction: '#FDB823', developpement: '#5aafaf', planifie: 'rgba(255,255,255,0.35)' }
const PHASE_RGBS = { termine: '0,171,99', construction: '253,184,35', developpement: '90,175,175', planifie: '255,255,255' }

/* -- Phase classifier -- */
function getPhase(p) {
  const today = new Date()
  const cs = new Date(p.constStart)
  const ce = new Date(p.constEnd)
  const avReel = p.cc && p.cc.avReel !== null ? p.cc.avReel : null
  if (avReel !== null) {
    if (avReel === 100) return 'termine'
    if (cs <= today) return 'construction'
  } else {
    if (ce < today && p.engPct === 100) return 'termine'
    if (cs <= today) return 'construction'
  }
  if (p.engPct !== null && p.engPct > 0) return 'developpement'
  return 'planifie'
}

/* -- Helpers -- */
function fmtM(v) { if (!v && v !== 0) return '\u2014'; return v >= 1 ? v.toFixed(1) + 'M$' : Math.round(v * 1000).toLocaleString('fr-FR') + 'k$' }
function fmtK(v) { if (!v) return '\u2014'; return v >= 1e6 ? (v / 1e6).toFixed(2) + 'M$' : Math.round(v / 1000) + 'k$' }
function fmtDate(d) { if (!d) return '\u2014'; const dt = new Date(d); return dt.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: '2-digit' }) }
function typeIcon(t) { return t === 'Eolien' || t === 'wind' ? '\uD83D\uDCA8' : t === 'Floating' || t === 'floating' ? '\uD83C\uDF0A' : '\u2600\uFE0F' }

export default function EnrProjets() {
  const [selectedProject, setSelectedProject] = useState(null)
  const [phaseFilter, setPhaseFilter] = useState(null)

  const projects = ENR_PROJECTS_DATA?.projects || []

  /* -- Project classification -- */
  const { grouped, totalMwc, totalCapex } = useMemo(() => {
    const g = { termine: [], construction: [], developpement: [], planifie: [] }
    let mwc = 0, capex = 0
    projects.forEach(p => {
      g[getPhase(p)].push(p)
      mwc += p.pvMw || 0
      capex += p.capexM || 0
    })
    return { grouped: g, totalMwc: mwc, totalCapex: capex }
  }, [projects])

  const activeFilter = phaseFilter
  const showPhases = activeFilter ? [activeFilter] : ['termine', 'construction', 'developpement', 'planifie']
  const filtered = activeFilter ? grouped[activeFilter] : projects

  // KPI aggregates for filtered set
  const fMw = filtered.reduce((s, p) => s + (p.pvMw || 0), 0)
  const fCapex = filtered.reduce((s, p) => s + (p.capexM || 0), 0)
  const fBess = filtered.reduce((s, p) => s + (p.bessMwh || 0), 0)
  const fProd = filtered.reduce((s, p) => s + (p.prodJour || 0), 0)
  const projsWithDelay = filtered.filter(p => p.glissement && p.glissement > 0)
  const avgDelay = projsWithDelay.length > 0 ? Math.round(projsWithDelay.reduce((s, p) => s + p.glissement, 0) / projsWithDelay.length) : 0

  const togglePhaseFilter = (phase) => {
    setPhaseFilter(prev => prev === phase ? null : phase)
  }

  const getFilterBtnStyle = (phase) => {
    const s = { termine: 'rgba(0,171,99,', construction: 'rgba(253,184,35,', developpement: 'rgba(90,175,175,', planifie: 'rgba(255,255,255,' }
    const bg = s[phase]
    const isActive = activeFilter === phase
    const isNone = activeFilter === null
    if (isActive) return { background: bg + '0.2)', borderColor: bg + '0.6)', transform: 'scale(1.03)', boxShadow: '0 0 16px ' + bg + '0.2)', opacity: 1 }
    if (isNone) return { background: phase === 'planifie' ? 'rgba(255,255,255,0.03)' : bg + '0.06)', borderColor: phase === 'planifie' ? 'rgba(255,255,255,0.08)' : bg + '0.15)', opacity: 1 }
    return { background: phase === 'planifie' ? 'rgba(255,255,255,0.02)' : bg + '0.03)', borderColor: phase === 'planifie' ? 'rgba(255,255,255,0.05)' : bg + '0.08)', opacity: 0.4 }
  }

  /* -- Full-screen project detail panel -- */
  if (selectedProject) {
    return <ProjectDetailPanel project={selectedProject} onClose={() => setSelectedProject(null)} />
  }

  return (
    <div>
      {/* Title */}
      <div style={{ fontSize: 20, fontWeight: 800, color: '#00ab63', marginBottom: 24 }}>Projets EnR</div>

      {/* KPI Consolidated (6 boxes) */}
      <div className="enrp-consolidated">
        <div className="enrp-kbox"><div className="kv" style={{ color: '#00ab63' }}>{filtered.length}</div><span className="kl">Projets</span></div>
        <div className="enrp-kbox"><div className="kv" style={{ color: '#00ab63' }}>{fMw.toFixed(1)}</div><span className="kl">MWc Pipeline</span></div>
        <div className="enrp-kbox"><div className="kv" style={{ color: '#FDB823' }}>{fCapex.toFixed(1)}M$</div><span className="kl">CAPEX Total</span></div>
        <div className="enrp-kbox"><div className="kv" style={{ color: '#5aafaf' }}>{fBess || 0}</div><span className="kl">MWh BESS</span><div className="ks">{fProd > 0 ? Math.round(fProd / 1000) + ' MWh/j est.' : ''}</div></div>
        <div className="enrp-kbox"><div className="kv" style={{ color: projsWithDelay.length > 0 ? '#ff5050' : 'rgba(255,255,255,0.3)' }}>{projsWithDelay.length}</div><span className="kl">En retard</span><div className="ks">{avgDelay > 0 ? 'moy. ' + avgDelay + 'j' : ''}</div></div>
        <div className="enrp-kbox"><div className="kv" style={{ color: '#00ab63' }}>{grouped.termine.length}</div><span className="kl">Termin&eacute;s</span><div className="ks">{grouped.construction.length} en constr.</div></div>
      </div>

      {/* Phase filters */}
      <div className="enrp-filters">
        {[
          { key: 'termine', label: 'Termin\u00e9', dotColor: '#00ab63', labelColor: 'rgba(0,171,99,0.7)', countColor: '#00ab63' },
          { key: 'construction', label: 'Construction', dotColor: '#FDB823', labelColor: 'rgba(253,184,35,0.7)', countColor: '#FDB823' },
          { key: 'developpement', label: 'D\u00e9veloppement', dotColor: '#5aafaf', labelColor: 'rgba(90,175,175,0.7)', countColor: '#5aafaf' },
          { key: 'planifie', label: 'Planifi\u00e9', dotColor: 'rgba(255,255,255,0.25)', labelColor: 'rgba(255,255,255,0.35)', countColor: 'rgba(255,255,255,0.4)' },
        ].map(f => (
          <div
            key={f.key}
            className="enrp-filter-btn"
            onClick={() => togglePhaseFilter(f.key)}
            style={getFilterBtnStyle(f.key)}
          >
            <div className="enrp-fdot" style={{ background: f.dotColor }} />
            <span className="enrp-flabel" style={{ color: f.labelColor }}>{f.label}</span>
            <span className="enrp-fcount" style={{ color: f.countColor }}>{grouped[f.key].length}</span>
          </div>
        ))}
      </div>

      {/* Delay alert */}
      {projsWithDelay.length > 0 && (
        <div className="enrp-alert">
          <span style={{ fontSize: 16 }}>{'\u26A0\uFE0F'}</span>
          <span style={{ fontWeight: 700, color: '#ff5050' }}>{projsWithDelay.length} projet{projsWithDelay.length > 1 ? 's' : ''} en retard</span>
          {projsWithDelay.map((p, i) => (
            <span key={i} className="enrp-alert-tag">{p.name.replace(/^(Top Energie |Vestop |Lidera |Floating Solar )/, '')} {p.glissement}j</span>
          ))}
        </div>
      )}

      {/* Phase sections with project cards */}
      {showPhases.map(phase => {
        const list = grouped[phase]
        if (!list.length) return null
        const color = PHASE_COLORS[phase]
        const rgb = PHASE_RGBS[phase]
        return (
          <div key={phase} className="enrp-phase-section">
            <div className="enrp-phase-hdr">
              <div className="dot" style={{ background: color, boxShadow: `0 0 8px ${color}` }} />
              <span className="lbl" style={{ color }}>{PHASE_LABELS[phase]}</span>
              <span className="cnt" style={{ color, background: `rgba(${rgb},0.12)` }}>{list.length}</span>
              <div className="line" style={{ background: `rgba(${rgb},0.15)` }} />
            </div>
            <div className="enrp-cards-grid">
              {list.map((p, pi) => (
                <EnrProjectCard key={p.id || pi} project={p} onClick={() => setSelectedProject(p)} />
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

/* -- ENR Project Card -- */
function EnrProjectCard({ project, onClick }) {
  const p = project
  const phase = getPhase(p)
  const color = PHASE_COLORS[phase]
  const rgb = PHASE_RGBS[phase]
  const engPct = p.engPct !== null ? p.engPct : 0
  const constProg = Math.round((p.constProg || 0) * 100)
  const gliss = p.glissement || 0
  const hasCc = p.cc && p.cc.avReel != null
  const avReel = hasCc ? p.cc.avReel : null

  return (
    <div className="enrp-card" style={{ borderColor: `rgba(${rgb},0.18)` }} onClick={onClick}>
      <div className="enrp-card-head">
        <span className="enrp-card-icon">{typeIcon(p.type)}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="enrp-card-title">{p.name}</div>
          <div className="enrp-card-sub">
            {p.loc || ''}{p.lead ? ' · ' + p.lead : ''}{p.epciste && p.epciste !== 'TBC' ? ' · ' + p.epciste : ''}
          </div>
        </div>
        <span className="enrp-card-badge" style={{ color, background: `rgba(${rgb},0.12)` }}>{PHASE_LABELS[phase]}</span>
      </div>
      <div className="enrp-card-kpis">
        <div className="enrp-ck"><div className="v" style={{ color: '#00ab63' }}>{p.pvMw || 0}</div><div className="l">MWc</div></div>
        <div className="enrp-ck"><div className="v" style={{ color: '#FDB823' }}>{fmtM(p.capexM)}</div><div className="l">CAPEX</div></div>
        <div className="enrp-ck"><div className="v" style={{ color: p.tri && p.tri >= 10 ? '#00ab63' : p.tri ? '#f37056' : 'rgba(255,255,255,0.25)' }}>{p.tri ? p.tri + '%' : '\u2014'}</div><div className="l">TRI</div></div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 8 }}>
        <div style={{ padding: '6px 8px', background: 'rgba(0,0,0,0.2)', borderRadius: 8 }}>
          <div style={{ fontSize: 7, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', marginBottom: 4 }}>Engineering</div>
          <div className="enrp-bar"><div className="enrp-bar-fill" style={{ width: `${engPct}%`, background: color }} /></div>
          <div style={{ fontSize: 12, fontWeight: 800, color }}>{p.engPct != null ? engPct + '%' : '\u2014'}</div>
        </div>
        <div style={{ padding: '6px 8px', background: 'rgba(0,0,0,0.2)', borderRadius: 8 }}>
          <div style={{ fontSize: 7, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', marginBottom: 4 }}>Construction</div>
          <div className="enrp-bar"><div className="enrp-bar-fill" style={{ width: `${constProg}%`, background: '#4a9eff' }} /></div>
          <div style={{ fontSize: 12, fontWeight: 800, color: '#4a9eff' }}>{constProg}%</div>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8, fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>
        <span>{fmtDate(p.constStart)} {'\u2192'} {fmtDate(p.constEnd)}</span>
        {avReel != null && <span style={{ marginLeft: 'auto', fontWeight: 700, color }}>R\u00e9el: {avReel}%</span>}
        {p.cc && p.cc.spi != null && (
          <span style={{ fontWeight: 700, color: p.cc.spi >= 0.9 ? '#00ab63' : p.cc.spi >= 0.7 ? '#FDB823' : '#ff5050' }}>
            SPI {Number(p.cc.spi).toFixed(2)}
          </span>
        )}
      </div>
      {gliss > 0 && <div className="enrp-delay">{'\u26A0'} {gliss}j de retard</div>}
      {p.comment && <div className="enrp-comment">{'\u26A0'} {p.comment}</div>}
    </div>
  )
}

/* ===================================================================
   PROJECT DETAIL PANEL — Full-screen panel matching original design
   =================================================================== */
function ProjectDetailPanel({ project, onClose }) {
  const p = project
  const cc = p.cc || {}
  const phase = getPhase(p)
  const color = PHASE_COLORS[phase]
  const rgb = PHASE_RGBS[phase]
  const hasCc = cc.bac != null && cc.bac > 0
  const engPct = p.engPct != null ? p.engPct : 0
  const avReel = hasCc && cc.avReel != null ? cc.avReel : null

  // EVM calculations
  const ev = cc.bac && cc.avReel ? cc.bac * (cc.avReel / 100) : null
  const etc = cc.forecast && cc.ac != null ? cc.forecast - cc.ac : null
  const cv = ev != null && cc.ac != null ? ev - cc.ac : null

  // Budget breakdown
  const total = (p.capexM || 0) * 1e6
  const dev = p.costDev || 0
  const pv = p.costPv || 0
  const other = Math.max(0, total - dev - pv)
  const pDev = total > 0 ? (dev / total) * 100 : 0
  const pPv = total > 0 ? (pv / total) * 100 : 0
  const pOth = total > 0 ? (other / total) * 100 : 0

  const cardStyle = {
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 14,
    padding: 16,
    textAlign: 'center',
  }
  const labelStyle = { fontSize: 8, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', marginBottom: 6 }
  const valStyle = (c) => ({ fontSize: 20, fontWeight: 800, color: c })

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000,
      background: 'var(--dark, #000000)',
      overflowY: 'auto',
      padding: '24px 32px 48px',
    }}>
      {/* Close button */}
      <button
        onClick={onClose}
        style={{
          position: 'sticky', top: 0, zIndex: 10,
          background: 'none', border: `1px solid rgba(${rgb},0.3)`, color,
          borderRadius: 8, padding: '6px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer',
          marginBottom: 16,
        }}
      >
        {'\u2190'} Projets EnR
      </button>

      {/* === HEADER === */}
      <div style={{ textAlign: 'center', borderBottom: `1px solid rgba(${rgb},0.15)`, paddingBottom: 24, marginBottom: 36 }}>
        <div style={{ fontSize: 24, fontWeight: 800, color }}>
          {typeIcon(p.type)} {p.name}
        </div>
        <div style={{ fontSize: 12, color: `rgba(${rgb},0.5)`, marginTop: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span>{p.pvMw} MW{p.bessMwh ? ' + ' + p.bessMwh + ' MWh BESS' : ''}</span>
          <span>&middot;</span>
          <span>{p.loc}</span>
          {p.chef && <><span>&middot;</span><span>{p.chef}</span></>}
          <span>&middot;</span>
          <span style={{
            background: `rgba(${rgb},0.15)`, color, border: `1px solid rgba(${rgb},0.3)`,
            borderRadius: 6, padding: '2px 10px', fontWeight: 700, fontSize: 10,
          }}>
            {PHASE_LABELS[phase]}
          </span>
        </div>
      </div>

      {/* === ROW 1: 6 KPI CARDS === */}
      <div className="enrp-detail-kpis-6" style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: 14, marginBottom: 36 }}>
        {/* CAPEX Total */}
        <div className="enr-kpi-card" style={cardStyle}>
          <div style={{ ...labelStyle, color: `rgba(${rgb},0.6)` }}>CAPEX Total</div>
          <div style={valStyle(color)}>{fmtM(p.capexM)}</div>
          <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', marginTop: 4 }}>D\u00e9v. {fmtK(p.costDev)}</div>
          <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)' }}>PV {fmtK(p.costPv)}</div>
        </div>
        {/* TRI */}
        <div style={cardStyle}>
          <div style={{ ...labelStyle, color: `rgba(${rgb},0.6)` }}>TRI</div>
          <div style={valStyle(p.tri >= 10 ? '#00ab63' : p.tri ? '#f37056' : 'rgba(255,255,255,0.3)')}>
            {p.tri != null ? p.tri + '%' : '\u2014'}
          </div>
          <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', marginTop: 4 }}>
            {p.tri >= 10 ? 'Rentable' : p.tri ? 'Faible' : 'À déterminer'}
          </div>
        </div>
        {/* Engineering */}
        <div style={cardStyle}>
          <div style={{ ...labelStyle, color: `rgba(${rgb},0.6)` }}>Engineering</div>
          <div style={valStyle(color)}>{p.engPct != null ? engPct + '%' : '\u2014'}</div>
          <div style={{ height: 5, background: `rgba(${rgb},0.12)`, borderRadius: 3, overflow: 'hidden', margin: '6px 0' }}>
            <div style={{ height: '100%', width: `${engPct}%`, background: color, borderRadius: 3 }} />
          </div>
          <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)' }}>{fmtDate(p.engStart)} {'\u2192'} {fmtDate(p.engEnd)}</div>
        </div>
        {/* Construction */}
        <div style={cardStyle}>
          <div style={{ ...labelStyle, color: `rgba(${rgb},0.6)` }}>Construction</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', lineHeight: 1.8, marginTop: 6 }}>
            <div>D\u00e9but: <span style={{ color, fontWeight: 700 }}>{fmtDate(p.constStart)}</span></div>
            <div>COD: <span style={{ color, fontWeight: 700 }}>{fmtDate(p.constEnd)}</span></div>
          </div>
        </div>
        {/* Avancement Reel */}
        <div style={cardStyle}>
          <div style={{ ...labelStyle, color: `rgba(${rgb},0.6)` }}>Avancement R\u00e9el</div>
          {avReel != null ? (
            <>
              <div style={valStyle(color)}>{avReel}%</div>
              <div style={{ height: 5, background: `rgba(${rgb},0.12)`, borderRadius: 3, overflow: 'hidden', margin: '6px 0' }}>
                <div style={{ height: '100%', width: `${avReel}%`, background: color, borderRadius: 3 }} />
              </div>
              <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)' }}>SPI: {cc.spi != null ? Number(cc.spi).toFixed(2) : '\u2014'}</div>
            </>
          ) : (
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.2)', marginTop: 10 }}>Donn\u00e9es \u00e0 venir</div>
          )}
        </div>
        {/* Performance */}
        <div style={cardStyle}>
          <div style={{ ...labelStyle, color: `rgba(${rgb},0.6)` }}>Performance</div>
          {cc.perf && !String(cc.perf).startsWith('#') ? (
            <>
              <div style={{ fontSize: 11, fontWeight: 600, color: String(cc.perf).includes('temps') ? '#00ab63' : '#f37056', marginTop: 8, lineHeight: 1.5 }}>{cc.perf}</div>
              {cc.cpi != null && <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', marginTop: 4 }}>CPI: {cc.cpi > 10 ? '>10' : Number(cc.cpi).toFixed(2)}</div>}
            </>
          ) : (
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.2)', marginTop: 10 }}>{'\u2014'}</div>
          )}
        </div>
      </div>

      {/* === EVM SECTION === */}
      {hasCc && (
        <>
          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.4em', textTransform: 'uppercase', color: `rgba(${rgb},0.5)`, marginBottom: 18 }}>
            Earned Value Management (EVM)
          </div>
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 20, padding: 24, marginBottom: 32 }}>
            {/* Row 1: 5 EVM cards */}
            <div className="enrp-evm-grid-5" style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 14, marginBottom: 20 }}>
              <div style={cardStyle}>
                <div style={labelStyle}>BAC</div>
                <div style={valStyle('rgba(255,255,255,0.85)')}>{fmtK(cc.bac)}</div>
              </div>
              <div style={cardStyle}>
                <div style={labelStyle}>Forecast</div>
                <div style={valStyle('#5aafaf')}>{fmtK(cc.forecast)}</div>
              </div>
              <div style={cardStyle}>
                <div style={labelStyle}>Co\u00fbt R\u00e9el (AC)</div>
                <div style={valStyle('#FDB823')}>{fmtK(cc.ac)}</div>
              </div>
              <div style={cardStyle}>
                <div style={labelStyle}>Valeur Acquise (EV)</div>
                <div style={valStyle('#00ab63')}>{ev ? fmtK(ev) : '\u2014'}</div>
              </div>
              <div style={cardStyle}>
                <div style={labelStyle}>Reste (ETC)</div>
                <div style={valStyle('#f37056')}>{etc != null ? fmtK(etc) : '\u2014'}</div>
              </div>
            </div>

            {/* Row 2: 4 performance cards */}
            <div className="enrp-perf-grid-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14 }}>
              {/* SPI */}
              <div style={cardStyle}>
                <div style={labelStyle}>SPI</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: cc.spi != null && cc.spi >= 1 ? '#00ab63' : cc.spi != null && cc.spi >= 0.9 ? '#FDB823' : cc.spi != null ? '#ff5050' : 'rgba(255,255,255,0.2)' }}>
                  {cc.spi != null ? Number(cc.spi).toFixed(2) : '\u2014'}
                </div>
                {cc.spi != null && (
                  <div style={{ height: 5, background: 'rgba(255,255,255,0.07)', borderRadius: 3, overflow: 'hidden', marginTop: 8 }}>
                    <div style={{ height: '100%', width: `${Math.min(cc.spi * 100, 100)}%`, background: cc.spi >= 1 ? '#00ab63' : '#f37056', borderRadius: 3 }} />
                  </div>
                )}
              </div>
              {/* CPI */}
              <div style={cardStyle}>
                <div style={labelStyle}>CPI</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: cc.cpi != null && cc.cpi >= 1 ? '#00ab63' : cc.cpi != null ? '#ff5050' : 'rgba(255,255,255,0.2)' }}>
                  {cc.cpi != null ? (cc.cpi > 10 ? '>10' : Number(cc.cpi).toFixed(2)) : '\u2014'}
                </div>
              </div>
              {/* Ecart Cout */}
              <div style={cardStyle}>
                <div style={labelStyle}>Écart Coût (CV)</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: cv != null && cv >= 0 ? '#00ab63' : '#ff5050' }}>
                  {cv != null ? fmtK(cv) : '—'}
                </div>
              </div>
              {/* Ecart Budget */}
              <div style={cardStyle}>
                <div style={labelStyle}>Écart Budget</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: cc.forecast <= cc.bac ? '#00ab63' : '#ff5050' }}>
                  {fmtK(cc.forecast - cc.bac)}
                </div>
                <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.25)', marginTop: 4 }}>
                  {cc.forecast <= cc.bac ? 'Sous budget' : 'D\u00e9passement'}
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* === BUDGET BREAKDOWN === */}
      {total > 0 && (
        <>
          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.4em', textTransform: 'uppercase', color: `rgba(${rgb},0.5)`, marginBottom: 18 }}>
            R\u00e9partition Budget
          </div>
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 20, padding: 24, marginBottom: 32 }}>
            {/* Stacked bar */}
            <div style={{ display: 'flex', height: 28, borderRadius: 8, overflow: 'hidden', marginBottom: 18 }}>
              <div style={{ flex: Math.max(pDev, 0.5), background: 'rgba(90,175,175,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontWeight: 700, color: '#fff' }}>
                {pDev > 8 ? 'D\u00e9v.' : ''}
              </div>
              <div style={{ flex: Math.max(pPv, 0.5), background: 'rgba(0,171,99,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontWeight: 700, color: '#fff' }}>
                {pPv > 8 ? 'PV / EPC' : ''}
              </div>
              <div style={{ flex: Math.max(pOth, 0.5), background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontWeight: 700, color: 'rgba(255,255,255,0.5)' }}>
                {pOth > 8 ? 'Autres' : ''}
              </div>
            </div>
            {/* Legend */}
            <div className="enrp-legend-grid-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14 }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(90,175,175,0.6)', marginBottom: 4 }}>D\u00e9veloppement</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: '#5aafaf' }}>{fmtK(dev)}</div>
                <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)' }}>{pDev.toFixed(1)}%</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(0,171,99,0.6)', marginBottom: 4 }}>PV / EPC</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: '#00ab63' }}>{fmtK(pv)}</div>
                <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)' }}>{pPv.toFixed(1)}%</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', marginBottom: 4 }}>Autres</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: 'rgba(255,255,255,0.5)' }}>{fmtK(other)}</div>
                <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)' }}>{pOth.toFixed(1)}%</div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* === COMMENTAIRE DG === */}
      <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.4em', textTransform: 'uppercase', color: `rgba(${rgb},0.5)`, marginBottom: 18 }}>
        Commentaire DG
      </div>
      <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 20, padding: 24, marginBottom: 32 }}>
        <textarea
          defaultValue={p.commentairesDG || p.comment || ''}
          placeholder="Ajouter un commentaire..."
          style={{
            width: '100%', minHeight: 80, background: 'rgba(0,0,0,0.2)',
            border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12,
            color: 'rgba(255,255,255,0.7)', padding: 16, fontSize: 12,
            resize: 'vertical', outline: 'none', fontFamily: 'inherit',
          }}
        />
      </div>

      {/* === BLOCAGES & ACTIONS === */}
      {p.blocages && (
        <div style={{ background: 'rgba(224,92,92,0.06)', border: '1px solid rgba(224,92,92,0.15)', borderRadius: 16, padding: '16px 20px', marginBottom: 12 }}>
          <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#E05C5C', marginBottom: 6 }}>Blocages</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>{p.blocages}</div>
        </div>
      )}
      {p.actionsS && (
        <div style={{ background: 'rgba(0,171,99,0.04)', border: '1px solid rgba(0,171,99,0.12)', borderRadius: 16, padding: '16px 20px', marginBottom: 12 }}>
          <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#00ab63', marginBottom: 6 }}>Actions</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>{p.actionsS}</div>
        </div>
      )}
    </div>
  )
}
