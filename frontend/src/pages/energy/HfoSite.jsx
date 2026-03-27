import NeonDot from '../../components/NeonDot'

/**
 * HfoSite — Individual HFO site card showing key KPIs.
 *
 * Props:
 *  site      — site data object (name, status, mw, contrat, groupes[], kpi{}, fuelStock, blackoutStats, stationUse)
 *  kpi       — resolved KPI object for current filter ({prod, prodObj, dispo, sfoc, sloc, heures})
 *  prodShare — percentage share of total production (0-100)
 *  onClick   — click handler
 */
export default function HfoSite({ site, kpi, prodShare = 0, onClick }) {
  const s = site
  const k = kpi || {}

  // Puissance dispo vs Contrat
  const puissPct = s.contrat > 0 ? Math.round((s.mw / s.contrat) * 100) : 0
  const puissColor = puissPct >= 95 ? '#00ab63' : puissPct >= 80 ? '#f37056' : '#E05C5C'

  // Production vs Prev
  const prodReal = k.prod || 0
  const prodPrev = k.prodObj || 0
  const prodDelta = prodPrev > 0 ? ((prodReal / prodPrev) - 1) * 100 : null
  const prodColor = prodDelta === null ? 'rgba(255,255,255,0.3)' : prodDelta >= 0 ? '#00ab63' : '#E05C5C'
  const prodSign = prodDelta !== null && prodDelta > 0 ? '+' : ''
  const prodPctStr = prodDelta !== null ? `${prodSign}${prodDelta.toFixed(1)}%` : '—'

  // Moteurs a l'arret
  const arretCount = s.groupes ? s.groupes.filter(g => g.statut !== 'ok').length : 0
  const totalMoteurs = s.groupes ? s.groupes.length : 0
  const arretColor = arretCount === 0 ? '#00ab63' : arretCount <= 2 ? '#f37056' : '#E05C5C'

  // Neon status: green if dispo >= 100% contrat, red otherwise
  const isOk = s.contrat > 0 && puissPct >= 100
  const neonStatus = isOk ? 'ok' : 'ko'

  // Construction / Reconstruction special states
  const isConstruction = s.status === 'construction' || s.status === 'reconstruction'

  // Fuel autonomy
  const fs = s.fuelStock || {}
  const hfoAuto = fs.hfoAutonomyDays != null ? fs.hfoAutonomyDays : null
  const hfoAutoColor = hfoAuto === null ? 'rgba(255,255,255,0.3)' : hfoAuto <= 3 ? '#E05C5C' : hfoAuto <= 10 ? '#f37056' : '#00ab63'

  // Blackouts
  const bs = s.blackoutStats || {}
  const boCount = bs.count || 0
  const boColor = boCount === 0 ? '#00ab63' : boCount <= 10 ? '#f37056' : '#E05C5C'

  // Station Use
  const su = s.stationUse || {}
  const stUsePct = su.avgStationUsePct != null ? su.avgStationUsePct : null
  const stUseColor = stUsePct === null ? 'rgba(255,255,255,0.3)' : stUsePct <= 5 ? '#00ab63' : stUsePct <= 8 ? '#f37056' : '#E05C5C'

  // SFOC/SLOC
  const sfocVal = k.sfoc != null && k.sfoc > 0 ? k.sfoc : null
  const sfocColor = sfocVal === null ? 'rgba(255,255,255,0.3)' : sfocVal <= 250 ? '#00ab63' : '#E05C5C'
  const slocVal = k.sloc != null && k.sloc > 0 ? k.sloc : null
  const slocColor = slocVal === null ? 'rgba(255,255,255,0.3)' : slocVal <= 1.0 ? '#00ab63' : '#E05C5C'

  const allKO = s.groupes && s.groupes.length > 0 && s.groupes.every(g => g.statut === 'ko')
  const borderCls = allKO ? 'border-[rgba(224,92,92,0.25)]' : 'border-[rgba(138,146,171,0.2)]'
  const labelColor = allKO ? 'rgba(224,92,92,0.6)' : 'rgba(138,146,171,0.65)'
  const bgKpi = allKO ? 'rgba(224,92,92,0.08)' : 'rgba(138,146,171,0.1)'

  if (isConstruction) {
    const isRecon = s.status === 'reconstruction'
    return (
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-center gap-2 h-[26px]">
          {isRecon
            ? <NeonDot status="ko" size={8} />
            : <span className="inline-block rounded-full w-2 h-2" style={{ background: 'var(--border)' }} />
          }
          <span className="text-xs font-bold tracking-wider uppercase">{s.name}</span>
        </div>
        <div
          className={`glass-card flex flex-col items-center justify-center gap-2 min-h-[200px] opacity-60`}
          style={{ borderColor: 'rgba(138,146,171,0.15)' }}
        >
          <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
            {isRecon ? 'En reparation' : 'En construction'}
          </span>
          <div className="text-[10px] text-[var(--text-dim)] text-center">
            {isRecon ? 'Mise en service Avril 2026' : 'Mise en service 2027'}
          </div>
          <div className="text-[11px] text-[var(--text-muted)] font-semibold">
            {parseFloat(s.mw || 0).toFixed(1)} MW
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      {/* Site name above card */}
      <div className="flex items-center justify-center gap-2 h-[26px]">
        <NeonDot status={neonStatus} size={8} />
        <span className="text-xs font-bold tracking-wider uppercase">{s.name}</span>
        <span className="text-[10px] font-bold text-[#f37056] opacity-85">
          {prodShare.toFixed(1)}%
        </span>
      </div>

      {/* Site card */}
      <div
        onClick={onClick}
        className={`glass-card p-4 cursor-pointer hover:-translate-y-1 transition-transform ${borderCls}`}
      >
        {/* KPI 1: Puissance dispo / Contrat */}
        <div className="pb-2.5 border-b mb-2.5" style={{ borderColor: allKO ? 'rgba(224,92,92,0.25)' : 'rgba(138,146,171,0.2)' }}>
          <div className="text-[8px] font-bold tracking-widest uppercase text-center mb-2" style={{ color: labelColor }}>
            Puissance dispo / Contrat
          </div>
          <div className="flex items-center justify-between gap-1">
            <div className="text-center flex-1">
              <div className="text-xl font-extrabold leading-none" style={{ color: puissColor }}>
                {parseFloat(s.mw).toFixed(1)}
                <span className="text-[9px] font-normal text-[var(--text-muted)] ml-0.5">MW</span>
              </div>
              <div className="text-[8px] text-[var(--text-dim)] mt-0.5">Dispo</div>
            </div>
            <div className="text-center flex-shrink-0 w-[38px]">
              <div className="text-[13px] font-extrabold" style={{ color: puissColor }}>{puissPct}%</div>
            </div>
            <div className="text-center flex-1">
              <div className="text-xl font-extrabold leading-none text-[var(--text-muted)]">
                {parseFloat(s.contrat).toFixed(1)}
                <span className="text-[9px] font-normal text-[var(--text-muted)] ml-0.5">MW</span>
              </div>
              <div className="text-[8px] text-[var(--text-dim)] mt-0.5">Contrat</div>
            </div>
          </div>
        </div>

        {/* KPI 2: Production vs Prev */}
        <div className="pb-2.5 border-b mb-2.5" style={{ borderColor: allKO ? 'rgba(224,92,92,0.25)' : 'rgba(138,146,171,0.2)' }}>
          <div className="text-[8px] font-bold tracking-widest uppercase text-center mb-2" style={{ color: labelColor }}>
            Production vs Previsionnel
          </div>
          <div className="flex items-center justify-between gap-1">
            <div className="text-center flex-1">
              <div className="text-[13px] font-bold leading-none" style={{ color: allKO ? '#E05C5C' : 'var(--text)' }}>
                {Math.round(prodReal).toLocaleString()}
                <span className="text-[8px] font-normal text-[var(--text-muted)] ml-0.5">MWh</span>
              </div>
              <div className="text-[8px] text-[var(--text-dim)] mt-0.5">Reel</div>
            </div>
            <div className="text-center flex-shrink-0 w-[44px]">
              <div className="text-[14px] font-extrabold" style={{ color: prodColor }}>{prodPctStr}</div>
            </div>
            <div className="text-center flex-1">
              <div className="text-[13px] font-bold leading-none text-[var(--text-muted)]">
                {prodPrev > 0 ? Math.round(prodPrev).toLocaleString() : '—'}
                <span className="text-[8px] font-normal text-[var(--text-muted)] ml-0.5">{prodPrev > 0 ? 'MWh' : ''}</span>
              </div>
              <div className="text-[8px] text-[var(--text-dim)] mt-0.5">Prevu</div>
            </div>
          </div>
        </div>

        {/* KPI 3: Moteurs a l'arret */}
        <div className="pb-2.5 border-b mb-2.5" style={{ borderColor: allKO ? 'rgba(224,92,92,0.25)' : 'rgba(138,146,171,0.2)' }}>
          <div className="text-[8px] font-bold tracking-widest uppercase text-center mb-2" style={{ color: labelColor }}>
            Moteurs a l'arret
          </div>
          <div className="flex items-center justify-center gap-2.5">
            <span className="text-[28px] font-extrabold leading-none tracking-tight" style={{ color: arretColor }}>
              {arretCount}
            </span>
            <span className="text-[10px] text-[var(--text-dim)] leading-tight">
              / {totalMoteurs}<br />moteurs
            </span>
          </div>
        </div>

        {/* KPI row: Fuel + Blackouts + Station Use */}
        <div className="flex gap-1.5 pb-2.5 border-b mb-2.5" style={{ borderColor: allKO ? 'rgba(224,92,92,0.25)' : 'rgba(138,146,171,0.2)' }}>
          <div className="flex-1 rounded-lg p-1.5 text-center flex flex-col justify-center" style={{ background: bgKpi }}>
            <div className="text-[7px] font-bold tracking-wider uppercase mb-0.5" style={{ color: labelColor }}>FUEL HFO</div>
            <div className="text-[13px] font-extrabold leading-none" style={{ color: hfoAutoColor }}>
              {hfoAuto !== null ? hfoAuto.toFixed(1) : '—'}
            </div>
            <div className="text-[7px] text-[var(--text-dim)] mt-0.5">jours autonomie</div>
            {fs.latestHfoStock != null && (
              <div className="text-[7px] text-[var(--text-muted)] mt-0.5">{Math.round(fs.latestHfoStock).toLocaleString()} L</div>
            )}
          </div>
          <div className="flex-1 rounded-lg p-1.5 text-center flex flex-col justify-center" style={{ background: bgKpi }}>
            <div className="text-[7px] font-bold tracking-wider uppercase mb-0.5" style={{ color: labelColor }}>BLACKOUTS</div>
            <div className="text-[13px] font-extrabold leading-none" style={{ color: boColor }}>
              {boCount}
            </div>
            <div className="text-[7px] text-[var(--text-dim)] mt-0.5">coupures</div>
          </div>
          <div className="flex-1 rounded-lg p-1.5 text-center flex flex-col justify-center" style={{ background: bgKpi }}>
            <div className="text-[7px] font-bold tracking-wider uppercase mb-0.5" style={{ color: labelColor }}>CONSO STATION</div>
            <div className="text-[13px] font-extrabold leading-none" style={{ color: stUseColor }}>
              {stUsePct !== null ? stUsePct.toFixed(1) : '—'}
            </div>
            <div className="text-[7px] text-[var(--text-dim)] mt-0.5">% auxiliaires</div>
          </div>
        </div>

        {/* SFOC + SLOC */}
        <div className="flex gap-1.5">
          <div className="flex-1 rounded-lg p-1.5 text-center min-h-[60px] flex flex-col justify-center" style={{ background: bgKpi }}>
            <div className="text-[7px] font-bold tracking-wider uppercase mb-0.5" style={{ color: labelColor }}>SFOC</div>
            <div className="text-[13px] font-extrabold leading-none" style={{ color: sfocColor }}>
              {sfocVal !== null ? sfocVal.toFixed(1) : '—'}
            </div>
            <div className="text-[7px] text-[var(--text-dim)] mt-0.5">g/kWh</div>
            <div className="text-[7px] font-semibold mt-0.5 opacity-80 min-h-[10px]" style={{ color: sfocColor }}>
              {sfocVal !== null ? (sfocVal <= 250 ? `−${(250 - sfocVal).toFixed(1)} vs limite` : `+${(sfocVal - 250).toFixed(1)} vs limite`) : ''}
            </div>
            <div className="text-[7px] text-[var(--text-muted)] mt-0.5">limite 250</div>
          </div>
          <div className="flex-1 rounded-lg p-1.5 text-center min-h-[60px] flex flex-col justify-center" style={{ background: bgKpi }}>
            <div className="text-[7px] font-bold tracking-wider uppercase mb-0.5" style={{ color: labelColor }}>SLOC</div>
            <div className="text-[13px] font-extrabold leading-none" style={{ color: slocColor }}>
              {slocVal !== null ? slocVal.toFixed(1) : '—'}
            </div>
            <div className="text-[7px] text-[var(--text-dim)] mt-0.5">g/kWh</div>
            <div className="text-[7px] font-semibold mt-0.5 opacity-80 min-h-[10px]" style={{ color: slocColor }}>
              {slocVal !== null ? (slocVal <= 1.0 ? `−${(1.0 - slocVal).toFixed(1)} vs limite` : `+${(slocVal - 1.0).toFixed(1)} vs limite`) : ''}
            </div>
            <div className="text-[7px] text-[var(--text-muted)] mt-0.5">limite 1.00</div>
          </div>
        </div>
      </div>
    </div>
  )
}
