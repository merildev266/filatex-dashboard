import NeonDot from '../../components/NeonDot'

/**
 * HfoSite — Individual HFO site card showing key KPIs.
 *
 * Props:
 *  site      — site data object (name, status, groupes[], contracts{enelec,vestopDispo,total})
 *  prodShare — percentage share of total production (0-100) — placeholder for now
 *  onClick   — click handler
 */
export default function HfoSite({ site, kpi = {}, prodShare = 0, onClick }) {
  const s = site

  // Site-level Puissance row: Peak | % | Dispo | % | Contrat
  // VESTOP helps cover the Peak but does NOT count toward ENELEC contract.
  const contracts = s.contracts || {}
  const contratEnelec = contracts.enelec || s.contrat || 0
  const contratVestop = contracts.vestop || 0
  const hasEnelecHere = contratEnelec > 0
  const hasVestopHere = contratVestop > 0
  const isMixedSite = hasEnelecHere && hasVestopHere
  const isPureVestopSite = hasVestopHere && !hasEnelecHere

  // Per-provider dispo from Global file (Situation moteurs)
  let dispoEnelec = 0
  let dispoVestop = 0
  for (const g of (s.groupes || [])) {
    const prov = (g.provider || '').toLowerCase()
    if (g.statut !== 'ok' || g.availableMw == null) continue
    const v = +g.availableMw
    if (Number.isNaN(v)) continue
    if (prov === 'enelec') dispoEnelec += v
    else if (prov === 'vestop') dispoVestop += v
  }
  dispoEnelec = Math.round(dispoEnelec * 10) / 10
  dispoVestop = Math.round(dispoVestop * 10) / 10
  const dispoTotal = Math.round((dispoEnelec + dispoVestop) * 10) / 10

  // Peak Load (from HEBDO sheet in Global file)
  const peakLoad = s.peakLoadLatest

  // Percentages — Dispo shown as % of each reference (Peak = 100%, Contrat = 100%)
  //  - Peak %     : total dispo (ENELEC+VESTOP) / peak  — VESTOP helps couvrir le peak
  //  - Contrat %  : ENELEC dispo / ENELEC contrat       — VESTOP n'influence pas le contrat
  const pctDispoPeak = (peakLoad != null && peakLoad > 0)
    ? Math.round((dispoTotal / peakLoad) * 100)
    : null
  const pctDispoContrat = contratEnelec > 0
    ? Math.round((dispoEnelec / contratEnelec) * 100)
    : 0

  // Color rules — green si dispo couvre la référence, rouge sinon
  const colorFor = (pct) => pct == null ? '#8a92ab'
    : pct >= 100 ? '#00ab63'
    : pct >= 80 ? '#f37056'
    : '#E05C5C'
  const peakColor = colorFor(pctDispoPeak)
  const covColor  = colorFor(pctDispoContrat)

  // Moteurs a l'arret
  const arretCount = s.groupes ? s.groupes.filter(g => g.statut !== 'ok').length : 0
  const totalMoteurs = s.groupes ? s.groupes.length : 0
  const arretColor = arretCount === 0 ? '#00ab63' : arretCount <= 2 ? '#f37056' : '#E05C5C'

  // Neon status: green if provider dispo covers provider contract, red otherwise
  const pctPureVestop = contratVestop > 0 ? Math.round((dispoVestop / contratVestop) * 100) : 0
  const isOk = isPureVestopSite
    ? pctPureVestop >= 100
    : (contratEnelec > 0 && pctDispoContrat >= 100)
  const neonStatus = isOk ? 'ok' : 'ko'

  // Construction / Reconstruction special states
  const isConstruction = s.status === 'construction' || s.status === 'reconstruction'

  const allKO = s.groupes && s.groupes.length > 0 && s.groupes.every(g => g.statut === 'ko')
  const borderCls = allKO ? 'border-[rgba(224,92,92,0.25)]' : 'border-[rgba(138,146,171,0.2)]'
  const labelColor = allKO ? 'rgba(224,92,92,0.6)' : 'rgba(138,146,171,0.65)'

  if (isConstruction) {
    const isRecon = s.status === 'reconstruction'
    return (
      <div className="flex flex-col gap-2 h-full">
        <div className="flex items-center justify-center gap-2 h-[26px]">
          {isRecon
            ? <NeonDot status="ko" size={8} />
            : <span className="inline-block rounded-full w-2 h-2" style={{ background: 'var(--border)' }} />
          }
          <span className="text-xs tracking-wider uppercase">{s.name}</span>
        </div>
        <div
          className={`glass-card flex-1 flex flex-col items-center justify-center gap-2 min-h-[200px] opacity-60`}
          style={{}}
        >
          <span className="text-[10px] uppercase tracking-wider text-[var(--text-muted)]">
            {isRecon ? 'En reparation' : 'En construction'}
          </span>
          <div className="text-[10px] text-[var(--text-dim)] text-center">
            {isRecon ? 'Mise en service Avril 2026' : 'Mise en service 2027'}
          </div>
          <div className="text-[11px] text-[var(--text-muted)]">
            {parseFloat(s.mw || 0).toFixed(1)} MW
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2 h-full">
      {/* Site name above card */}
      <div className="flex items-center justify-center gap-2 h-[26px]">
        <NeonDot status={neonStatus} size={8} />
        <span className="text-xs tracking-wider uppercase">{s.name}</span>
      </div>

      {/* Site card */}
      <div
        onClick={onClick}
        className={`glass-card clickable-energy p-4 flex-1 flex flex-col ${borderCls}`}
      >
        {/* KPI 1: Puissance — Ligne 1 = Peak (libre), Ligne 2 = Contrat (alignée avec SLOC/SFOC et Production/Moteurs en 2 colonnes) */}
        <div className="pb-2.5 border-b mb-2.5" style={{ borderColor: allKO ? 'rgba(224,92,92,0.25)' : 'rgba(138,146,171,0.2)' }}>
          <div className="text-[8px] tracking-widest uppercase text-center mb-2" style={{ color: labelColor }}>
            Puissance
          </div>

          {/* ═══ Ligne 1 : Peak — ENELEC + VESTOP (mixte) | % | Peak ═══ */}
          <div className="relative grid grid-cols-2 gap-2 items-center">
            {/* Col gauche : Dispo — valeur unique (total ENELEC+VESTOP pour les sites mixtes) */}
            <div className="text-center">
              {isMixedSite ? (
                <div>
                  <div className="text-lg leading-none" style={{ color: peakColor }}>
                    {parseFloat(dispoTotal).toFixed(1)}
                    <span className="text-[8px] font-normal text-[var(--text-muted)] ml-0.5">MW</span>
                  </div>
                  <div className="text-[8px] text-[var(--text-dim)] mt-0.5 tracking-widest uppercase">ENELEC + VESTOP</div>
                </div>
              ) : isPureVestopSite ? (
                <div>
                  <div className="text-lg leading-none" style={{ color: peakColor }}>
                    {parseFloat(dispoVestop).toFixed(1)}
                    <span className="text-[8px] font-normal text-[var(--text-muted)] ml-0.5">MW</span>
                  </div>
                  <div className="text-[8px] mt-0.5 tracking-widest uppercase" style={{ color: '#5aafaf' }}>VESTOP</div>
                </div>
              ) : (
                <div>
                  <div className="text-lg leading-none" style={{ color: peakColor }}>
                    {parseFloat(dispoEnelec).toFixed(1)}
                    <span className="text-[8px] font-normal text-[var(--text-muted)] ml-0.5">MW</span>
                  </div>
                  <div className="text-[8px] text-[var(--text-dim)] mt-0.5">Disponible</div>
                </div>
              )}
            </div>
            {/* Col droite : Peak */}
            <div className="text-center">
              <div className="text-lg leading-none text-[var(--text)]">
                {peakLoad != null ? parseFloat(peakLoad).toFixed(1) : '—'}
                <span className="text-[8px] font-normal text-[var(--text-muted)] ml-0.5">MW</span>
              </div>
              <div className="text-[8px] text-[var(--text-dim)] mt-0.5">Peak</div>
            </div>
            {/* % au milieu — absolument positionné entre les 2 colonnes */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-[11px] leading-none px-1" style={{ color: peakColor }}>
              {pctDispoPeak != null ? `${pctDispoPeak}%` : '—'}
            </div>
          </div>

          {/* Séparateur entre les deux lignes */}
          <div className="h-px my-1.5" style={{ background: allKO ? 'rgba(224,92,92,0.15)' : 'rgba(138,146,171,0.12)' }} />

          {/* ═══ Ligne 2 : Contrat — Dispo (ENELEC ou VESTOP) | % | Contrat ═══ */}
          <div className="relative grid grid-cols-2 gap-2 items-center">
            {/* Col gauche : Dispo ENELEC (ou VESTOP pour site pur VESTOP) */}
            <div className="text-center">
              <div className="text-lg leading-none" style={{ color: isPureVestopSite ? colorFor(contratVestop > 0 ? Math.round((dispoVestop / contratVestop) * 100) : null) : covColor }}>
                {parseFloat(isPureVestopSite ? dispoVestop : dispoEnelec).toFixed(1)}
                <span className="text-[8px] font-normal text-[var(--text-muted)] ml-0.5">MW</span>
              </div>
              <div className="text-[8px] mt-0.5 tracking-widest uppercase" style={{ color: isPureVestopSite ? '#5aafaf' : 'var(--text-dim)' }}>
                {isPureVestopSite ? 'VESTOP' : (isMixedSite ? 'ENELEC' : 'Disponible')}
              </div>
            </div>
            {/* Col droite : Contrat */}
            <div className="text-center">
              <div className="text-lg leading-none text-[var(--text-muted)]">
                {(isPureVestopSite ? contratVestop : contratEnelec).toFixed(1)}
                <span className="text-[8px] font-normal text-[var(--text-muted)] ml-0.5">MW</span>
              </div>
              <div className="text-[8px] text-[var(--text-dim)] mt-0.5">Contrat</div>
            </div>
            {/* % au milieu — absolument positionné entre les 2 colonnes */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-[11px] leading-none px-1" style={{ color: isPureVestopSite ? colorFor(contratVestop > 0 ? Math.round((dispoVestop / contratVestop) * 100) : null) : covColor }}>
              {isPureVestopSite
                ? (contratVestop > 0 ? `${Math.round((dispoVestop / contratVestop) * 100)}%` : '—')
                : (contratEnelec > 0 ? `${pctDispoContrat}%` : '—')}
            </div>
          </div>
        </div>

        {/* KPI 2: SLOC | SFOC */}
        <div className="pb-2.5 border-b mb-2.5" style={{ borderColor: allKO ? 'rgba(224,92,92,0.25)' : 'rgba(138,146,171,0.2)' }}>
          <div className="grid grid-cols-2 gap-2">
            <div className="text-center">
              <div className="text-[8px] tracking-widest uppercase mb-1" style={{ color: labelColor }}>SLOC</div>
              <div className="text-lg leading-none text-[var(--text)]">
                {kpi?.sloc != null ? parseFloat(kpi.sloc).toFixed(2) : '—'}
                <span className="text-[8px] font-normal text-[var(--text-muted)] ml-0.5">g/kWh</span>
              </div>
            </div>
            <div className="text-center">
              <div className="text-[8px] tracking-widest uppercase mb-1" style={{ color: labelColor }}>SFOC</div>
              <div className="text-lg leading-none text-[var(--text)]">
                {kpi?.sfoc != null ? Math.round(kpi.sfoc).toString() : '—'}
                <span className="text-[8px] font-normal text-[var(--text-muted)] ml-0.5">g/kWh</span>
              </div>
            </div>
          </div>
        </div>

        {/* KPI 3: Production | Moteurs a l'arret */}
        <div>
          <div className="grid grid-cols-2 gap-2">
            <div className="text-center">
              <div className="text-[8px] tracking-widest uppercase mb-1" style={{ color: labelColor }}>Production</div>
              <div className="text-lg leading-none text-[var(--text)]">
                {kpi?.prod != null ? Math.round(kpi.prod).toString() : '—'}
                <span className="text-[8px] font-normal text-[var(--text-muted)] ml-0.5">MWh</span>
              </div>
            </div>
            <div className="text-center">
              <div className="text-[8px] tracking-widest uppercase mb-1" style={{ color: labelColor }}>Moteurs a l'arret</div>
              <div className="flex items-baseline justify-center gap-1">
                <span className="text-lg leading-none" style={{ color: arretColor }}>
                  {arretCount}
                </span>
                <span className="text-[9px] text-[var(--text-dim)]">/ {totalMoteurs}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
