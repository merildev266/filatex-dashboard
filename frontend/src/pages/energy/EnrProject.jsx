import NeonDot from '../../components/NeonDot'

/**
 * EnrProject — Individual ENR project card.
 *
 * Props:
 *  project — from ENR_PROJECTS_DATA.projects[]
 *  onClick — click handler
 */
export default function EnrProject({ project, onClick }) {
  const p = project
  const cc = p.cc || {}
  const spi = cc.spi
  const cpi = cc.cpi

  // SPI status: >= 1.0 = ok, >= 0.8 = warn, else ko
  const spiStatus = spi == null ? 'ok' : spi >= 1.0 ? 'ok' : spi >= 0.8 ? 'warn' : 'ko'

  // Phase color
  const phaseColors = {
    'Termine': '#00ab63',
    'Construction': '#5aafaf',
    'Etude': '#426ab3',
    'Prospection': 'rgba(255,255,255,0.4)',
  }
  const phaseColor = phaseColors[p.phase] || 'rgba(255,255,255,0.4)'

  const engPct = p.engPct || p.engProgression || 0
  const constPct = p.constProg != null ? Math.round(p.constProg * 100) : (p.avancement || 0)

  return (
    <div
      onClick={onClick}
      className="glass-card p-4 cursor-pointer hover:-translate-y-1 transition-transform"
    >
      {/* Header: name + phase */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <NeonDot status={spiStatus} size={8} />
          <h3 className="text-sm font-semibold leading-tight truncate">{p.name}</h3>
        </div>
        <span
          className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded flex-shrink-0"
          style={{ color: phaseColor, background: `${phaseColor}22` }}
        >
          {p.phase || 'N/A'}
        </span>
      </div>

      {/* Key metrics row */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="text-center">
          <div className="text-[7px] font-bold tracking-wider uppercase text-[var(--text-dim)]">MWc</div>
          <div className="text-base font-extrabold text-[#00ab63]">{p.pvMw}</div>
        </div>
        <div className="text-center">
          <div className="text-[7px] font-bold tracking-wider uppercase text-[var(--text-dim)]">CAPEX</div>
          <div className="text-base font-extrabold text-white/80">
            {p.capexM ? `${p.capexM.toFixed(1)}M$` : '—'}
          </div>
        </div>
        <div className="text-center">
          <div className="text-[7px] font-bold tracking-wider uppercase text-[var(--text-dim)]">TRI</div>
          <div className="text-base font-extrabold text-white/80">
            {p.tri ? `${p.tri}%` : '—'}
          </div>
        </div>
      </div>

      {/* SPI / CPI indicators */}
      {(spi != null || cpi != null) && (
        <div className="flex gap-3 mb-3">
          {spi != null && (
            <div className="flex items-center gap-1.5">
              <span className="text-[8px] font-bold tracking-wider uppercase text-[var(--text-dim)]">SPI</span>
              <span className="text-sm font-extrabold" style={{ color: spi >= 1.0 ? '#00ab63' : spi >= 0.8 ? '#f37056' : '#E05C5C' }}>
                {spi.toFixed(2)}
              </span>
            </div>
          )}
          {cpi != null && (
            <div className="flex items-center gap-1.5">
              <span className="text-[8px] font-bold tracking-wider uppercase text-[var(--text-dim)]">CPI</span>
              <span className="text-sm font-extrabold" style={{ color: cpi >= 1.0 ? '#00ab63' : cpi >= 0.8 ? '#f37056' : '#E05C5C' }}>
                {cpi.toFixed(2)}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Progress bars: Engineering + Construction */}
      <div className="space-y-2">
        <div>
          <div className="flex justify-between text-[8px] mb-0.5">
            <span className="text-[var(--text-dim)] uppercase tracking-wider font-bold">Etudes</span>
            <span className="text-white/50">{engPct}%</span>
          </div>
          <div className="h-1.5 bg-white/8 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${Math.min(engPct, 100)}%`, backgroundColor: '#426ab3' }}
            />
          </div>
        </div>
        <div>
          <div className="flex justify-between text-[8px] mb-0.5">
            <span className="text-[var(--text-dim)] uppercase tracking-wider font-bold">Construction</span>
            <span className="text-white/50">{constPct}%</span>
          </div>
          <div className="h-1.5 bg-white/8 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${Math.min(constPct, 100)}%`, backgroundColor: '#00ab63' }}
            />
          </div>
        </div>
      </div>

      {/* Location + Lead */}
      <div className="mt-3 text-[9px] text-[var(--text-dim)]">
        {p.loc && <span>{p.loc}</span>}
        {p.lead && <span> · {p.lead}</span>}
        {p.epciste && <span> · {p.epciste}</span>}
      </div>
    </div>
  )
}
