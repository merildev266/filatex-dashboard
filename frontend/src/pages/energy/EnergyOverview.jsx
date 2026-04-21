import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useFilters } from '../../hooks/useFilters'
import { TAMATAVE_LIVE, DIEGO_LIVE, MAJUNGA_LIVE, TULEAR_LIVE, ANTSIRABE_LIVE, FIHAONANA_LIVE, HFO_GLOBAL } from '../../data/site_data'
import { ENR_SITES } from '../../data/enr_site_data'
import { ENR_PROJECTS_DATA } from '../../data/enr_projects_data'
import { HFO_PROJECTS } from '../../data/hfo_projects'
import { MOIS_FR, getKpiForSite } from '../../utils/hfoHelpers'
import { getFilteredEnrSite } from '../../utils/enrHelpers'

// Merge live data for overview
const LIVE_SITES = {
  tamatave: TAMATAVE_LIVE,
  diego: DIEGO_LIVE,
  majunga: MAJUNGA_LIVE,
  tulear: TULEAR_LIVE,
  antsirabe: ANTSIRABE_LIVE,
  fihaonana: FIHAONANA_LIVE,
}

const ALL_SITES = { ...LIVE_SITES }
const SITE_ORDER = ['tamatave', 'tulear', 'diego', 'majunga', 'antsirabe', 'fihaonana']
const LIVE_IDS = ['tamatave', 'diego', 'majunga', 'tulear']

/** Get the last day (1-based) where ALL 4 live sites have data */
function getLastDayAllSites() {
  let minDay = 31
  LIVE_IDS.forEach(id => {
    const site = LIVE_SITES[id]
    if (!site?.latestDate) return
    const d = new Date(site.latestDate)
    const day = d.getDate()
    if (day < minDay) minDay = day
  })
  return minDay
}

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

export default function EnergyOverview() {
  const navigate = useNavigate()
  const { currentFilter, selectedMonthIndex, selectedQuarter, selectedYear, selectedWeek, selectedWeekYear } = useFilters()

  // Date display
  const dateLabel = useMemo(() => {
    if (currentFilter === 'S') return `S${selectedWeek} ${selectedWeekYear || selectedYear}`
    if (currentFilter === 'M') return MOIS_FR[selectedMonthIndex] + ' ' + selectedYear
    if (currentFilter === 'Q') return 'Q' + selectedQuarter + ' ' + selectedYear
    if (currentFilter === 'A') return String(selectedYear)
    return ''
  }, [currentFilter, selectedMonthIndex, selectedQuarter, selectedYear, selectedWeek, selectedWeekYear])

  // HFO aggregates
  const hfo = useMemo(() => {
    let totalDispo = 0, totalContratEnelec = 0, totalContratVestop = 0
    let totalDispoEnelec = 0, totalDispoVestop = 0
    let totalNominalEnelec = 0, totalNominalVestop = 0
    let totalProd = 0, totalProdObj = 0
    let totalMoteurs = 0, totalArret = 0, arretMW = 0
    let sfocWeighted = 0, slocWeighted = 0
    let totalBlackouts = null
    let maxPeak = 0

    SITE_ORDER.forEach(id => {
      const s = ALL_SITES[id]
      if (!s || s.status === 'construction' || s.status === 'reconstruction') return
      totalDispo += s.dispoTotal != null ? s.dispoTotal : (s.mw || 0)
      totalContratEnelec += s.contracts?.enelec || 0
      totalContratVestop += s.contracts?.vestop || 0
      if (s.peakLoadLatest != null && s.peakLoadLatest > maxPeak) maxPeak = s.peakLoadLatest
      if (s.groupes) {
        totalMoteurs += s.groupes.length
        s.groupes.forEach(g => {
          if (g.statut !== 'ok') { totalArret++; arretMW += g.mw || 0 }
          const prov = (g.provider || '').toLowerCase()
          // Nominal par provider = somme des nominal (ou mw) de tous les moteurs
          const nom = +g.nominal || +g.mw || 0
          if (prov === 'enelec') totalNominalEnelec += nom
          else if (prov === 'vestop') totalNominalVestop += nom
          // Dispo par provider = somme des availableMw des moteurs en marche
          if (g.statut === 'ok' && g.availableMw != null) {
            if (prov === 'enelec') totalDispoEnelec += +g.availableMw
            else if (prov === 'vestop') totalDispoVestop += +g.availableMw
          }
        })
      }
      const k = getKpiForSite(s, currentFilter, selectedMonthIndex, selectedQuarter, selectedYear, selectedWeek, selectedWeekYear)
      totalProd += k.prod || 0
      totalProdObj += k.prodObj || 0
      if (k.sfoc && k.prod) sfocWeighted += k.sfoc * k.prod
      if (k.sloc && k.prod) slocWeighted += k.sloc * k.prod
      if (s.blackoutStats && s.blackoutStats.count != null) {
        totalBlackouts = (totalBlackouts || 0) + s.blackoutStats.count
      }
    })

    // VESTOP : le contrat total est fixé dans hfo_config.VESTOP_TOTAL_CONTRACT (23.5 MW).
    // La somme par site (SITE_CONTRACTS.vestop) exclut les sites en construction et ne
    // reflète pas le contrat global — on utilise donc la constante comme source de vérité.
    const vestopContratGlobal = HFO_GLOBAL?.vestopTotalContract ?? totalContratVestop
    totalContratVestop = vestopContratGlobal

    const totalContrat = totalContratEnelec + totalContratVestop
    const pctContrat = totalContrat > 0 ? ((totalDispo / totalContrat) * 100) : 0
    const pctEnelec = totalContratEnelec > 0 ? ((totalDispoEnelec / totalContratEnelec) * 100) : 0
    const pctVestop = totalContratVestop > 0 ? ((totalDispoVestop / totalContratVestop) * 100) : 0
    const pctProd = totalProdObj > 0 ? ((totalProd / totalProdObj) * 100) : 0
    const avgSfoc = totalProd > 0 ? (sfocWeighted / totalProd) : 0
    const avgSloc = totalProd > 0 ? (slocWeighted / totalProd) : 0

    // Period label
    const periodLabel = currentFilter === 'A' ? String(selectedYear)
      : currentFilter === 'Q' ? 'Q' + selectedQuarter
      : currentFilter === 'S' ? `S${selectedWeek}`
      : MOIS_FR[selectedMonthIndex]

    return {
      totalMW: totalDispo,
      totalContrat, totalContratEnelec, totalContratVestop, pctContrat,
      totalDispoEnelec, totalDispoVestop, pctEnelec, pctVestop,
      totalNominalEnelec, totalNominalVestop,
      totalProd, totalProdObj, pctProd,
      avgSfoc, avgSloc,
      maxPeak, totalBlackouts,
      totalMoteurs, totalArret, periodLabel,
      urgents: HFO_PROJECTS?.urgents || 0,
      enCours: HFO_PROJECTS?.enCours || 0,
      projectCount: HFO_PROJECTS?.total || 0,
    }
  }, [currentFilter, selectedMonthIndex, selectedQuarter, selectedYear, selectedWeek, selectedWeekYear])

  // ENR aggregates (filtered by time period)
  const enr = useMemo(() => {
    const sites = ENR_SITES || []
    const projects = ENR_PROJECTS_DATA?.projects || []

    // Filter-aware production aggregates
    let totalCapKwc = 0, totalProdKwh = 0, totalAvgDailyKwh = 0, totalDays = 0
    const siteFiltered = sites.map(s => {
      totalCapKwc += s.capacityKwc || 0
      const fd = getFilteredEnrSite(s, currentFilter, selectedMonthIndex, selectedQuarter, selectedYear, selectedWeek, selectedWeekYear)
      totalProdKwh += fd.prodKwh
      totalAvgDailyKwh += fd.avgDailyKwh
      totalDays += fd.days
      return fd
    })
    const totalCapMw = totalCapKwc / 1000
    const enrMwhJ = totalAvgDailyKwh / 1000
    const ratioKwhKwc = totalCapKwc > 0 ? (totalAvgDailyKwh / totalCapKwc).toFixed(2) : '\u2014'
    const cumulMwh = Math.round(totalProdKwh / 1000)

    // Mix calculation (avg daily)
    let totalHfoAvgDaily = 0
    SITE_ORDER.forEach(id => {
      const s = ALL_SITES[id]
      if (!s || s.status === 'construction' || s.status === 'reconstruction') return
      const k = getKpiForSite(s, currentFilter, selectedMonthIndex, selectedQuarter, selectedYear, selectedWeek, selectedWeekYear)
      if (k.prod && totalDays > 0) {
        totalHfoAvgDaily += k.prod / totalDays
      }
    })
    const totalDaily = totalHfoAvgDaily + enrMwhJ
    const mixPct = totalDaily > 0 ? (enrMwhJ / totalDaily * 100) : 0

    // Project aggregates
    let totalMwcPipeline = 0, totalCapex = 0
    const grouped = { termine: [], construction: [], developpement: [], planifie: [] }
    projects.forEach(p => {
      totalMwcPipeline += p.pvMw || 0
      totalCapex += p.capexM || 0
      grouped[getPhase(p)].push(p)
    })
    const delayCount = projects.filter(p => p.glissement > 0).length

    return {
      totalCapMw, enrMwhJ, ratioKwhKwc, cumulMwh,
      sites, siteFiltered, sitesCount: sites.length,
      mixPct,
      projectCount: projects.length,
      totalMwcPipeline, totalCapex,
      grouped, delayCount,
    }
  }, [currentFilter, selectedMonthIndex, selectedQuarter, selectedYear, selectedWeek, selectedWeekYear])

  return (
    <div>
      {/* ═══ DATE BANNER — above the 2-column layout ═══ */}
      <div className="e-date-banner">{dateLabel}</div>

      <div className="e-wrap page-energy-wrap">
      {/* ═══ COLONNE GAUCHE - HFO ═══ */}
      <div className="e-col">
        <div className="e-col-title" style={{ color: 'var(--text-dim)' }}>HFO</div>

        {/* HFO Production card */}
        <div
          className="capex-section-card e-card unified-card clickable-energy"
          onClick={() => navigate('/energy/hfo')}
        >
          {/* Row 1: Puissance ENELEC — Contrat | Disponible + % | Nominal */}
          <div className="e-sec">
            <div className="e-sec-label" style={{ color: 'rgba(0,171,99,0.95)' }}>Puissance ENELEC</div>
            <div className="e-kpi-row">
              <div className="e-kpi-left">
                <div className="e-big">
                  {hfo.totalContratEnelec.toFixed(1)} <span className="e-big-unit">MW</span>
                </div>
                <div className="e-sub">Contrat</div>
              </div>
              <div className="e-kpi-center e-kpi-center-wide">
                <div className="e-big">
                  {hfo.totalDispoEnelec.toFixed(1)} <span className="e-big-unit">MW</span>
                </div>
                <div className="e-sub">Disponible</div>
                <div className="e-pct-arrow e-pct-below" style={{ color: hfo.pctEnelec >= 100 ? 'rgba(0,171,99,0.9)' : 'rgba(243,112,86,0.9)' }}>
                  {hfo.pctEnelec.toFixed(0)}% du contrat
                </div>
              </div>
              <div className="e-kpi-right">
                <div className="e-big">
                  {hfo.totalNominalEnelec.toFixed(1)} <span className="e-big-unit">MW</span>
                </div>
                <div className="e-sub">Nominal</div>
              </div>
            </div>
          </div>

          {/* Row 2: Puissance VESTOP — Contrat | Disponible + % | Nominal */}
          <div className="e-sec">
            <div className="e-sec-label" style={{ color: '#5aafaf' }}>Puissance VESTOP</div>
            <div className="e-kpi-row">
              <div className="e-kpi-left">
                <div className="e-big">
                  {hfo.totalContratVestop.toFixed(1)} <span className="e-big-unit">MW</span>
                </div>
                <div className="e-sub">Contrat</div>
              </div>
              <div className="e-kpi-center e-kpi-center-wide">
                <div className="e-big">
                  {hfo.totalDispoVestop.toFixed(1)} <span className="e-big-unit">MW</span>
                </div>
                <div className="e-sub">Disponible</div>
                <div className="e-pct-arrow e-pct-below" style={{ color: hfo.pctVestop >= 100 ? 'rgba(0,171,99,0.9)' : 'rgba(243,112,86,0.9)' }}>
                  {hfo.pctVestop.toFixed(0)}% du contrat
                </div>
              </div>
              <div className="e-kpi-right">
                <div className="e-big">
                  {hfo.totalNominalVestop.toFixed(1)} <span className="e-big-unit">MW</span>
                </div>
                <div className="e-sub">Nominal</div>
              </div>
            </div>
          </div>

          {/* Row 2: Moteurs en marche (G) | Production réelle (C) | Moteurs à l'arrêt (D) */}
          <div className="e-sec">
            <div className="e-sec-label">Production · Moteurs</div>
            <div className="e-kpi-row">
              <div className="e-kpi-left">
                <div className="e-big" style={{ color: 'var(--energy)' }}>
                  {hfo.totalMoteurs - hfo.totalArret}
                </div>
                <div className="e-sub">En marche</div>
              </div>
              <div className="e-kpi-center e-kpi-center-wide">
                <div className="e-big" style={{ color: hfo.totalProd > 0 ? 'var(--text)' : 'var(--text-muted)' }}>
                  {hfo.totalProd > 0 ? Math.round(hfo.totalProd).toLocaleString() : 'N/A'} <span className="e-big-unit">MWh</span>
                </div>
                <div className="e-sub">Production · {hfo.periodLabel}</div>
              </div>
              <div className="e-kpi-right">
                <div className="e-big" style={{ color: hfo.totalArret === 0 ? 'var(--energy)' : 'rgba(243,112,86,0.95)' }}>
                  {hfo.totalArret}
                </div>
                <div className="e-sub">À l'arrêt</div>
              </div>
            </div>
          </div>

          {/* Row 3: SFOC (G) | SLOC (D) — vert si sous objectif (250/1), rouge si dessus */}
          <div className="e-sec">
            <div className="e-sec-label">Consommations spécifiques</div>
            <div className="e-kpi-row">
              <div className="e-kpi-left">
                <div className="e-big" style={{ color: hfo.avgSfoc > 0 ? (hfo.avgSfoc <= 250 ? 'var(--energy)' : 'var(--red)') : 'var(--text-muted)' }}>
                  {hfo.avgSfoc > 0 ? Math.round(hfo.avgSfoc) : 'N/A'} <span className="e-big-unit">g/kWh</span>
                </div>
                <div className="e-sub">SFOC · {hfo.periodLabel}</div>
              </div>
              <div className="e-kpi-center"><div className="e-kpi-sep"></div></div>
              <div className="e-kpi-right">
                <div className="e-big" style={{ color: hfo.avgSloc > 0 ? (hfo.avgSloc <= 1 ? 'var(--energy)' : 'var(--red)') : 'var(--text-muted)' }}>
                  {hfo.avgSloc > 0 ? hfo.avgSloc.toFixed(2) : 'N/A'} <span className="e-big-unit">g/kWh</span>
                </div>
                <div className="e-sub">SLOC · {hfo.periodLabel}</div>
              </div>
            </div>
          </div>
        </div>

        {/* HFO Projets */}
        <div className="e-col-title e-col-title-proj" style={{ color: 'var(--text-dim)' }}>Projets</div>
        <div
          className="capex-section-card e-card e-card-mini unified-card clickable-energy"
          onClick={() => navigate('/energy/hfo-projets')}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '22px', fontWeight: 400, color: 'var(--text)' }}>{hfo.projectCount}</div>
              <div style={{ fontSize: '7px', color: 'var(--text-dim)', textTransform: 'uppercase' }}>projets</div>
            </div>
            <div style={{ width: '1px', height: '24px', background: 'var(--border)' }}></div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '18px', fontWeight: 400, color: 'var(--text)' }}>{hfo.urgents}</div>
              <div style={{ fontSize: '7px', color: 'var(--text-dim)', textTransform: 'uppercase' }}>urgent</div>
            </div>
            <div style={{ width: '1px', height: '24px', background: 'var(--border)' }}></div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '18px', fontWeight: 400, color: 'var(--text-secondary)' }}>{hfo.enCours}</div>
              <div style={{ fontSize: '7px', color: 'var(--text-dim)', textTransform: 'uppercase' }}>en cours</div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ COLONNE DROITE - EnR ═══ */}
      <div className="e-col">
        <div className="e-col-title" style={{ color: 'var(--text)' }}>EnR</div>

        {/* EnR Production card */}
        <div
          className="capex-section-card e-card e-enr unified-card clickable-energy"
          onClick={() => navigate('/energy/enr')}
        >
          {/* Production moyenne vs Capacite */}
          <div className="e-sec">
            <div className="e-sec-label" style={{ color: 'var(--text-dim)' }}>Production moyenne vs Capacité</div>
            <div className="e-kpi-row">
              <div className="e-kpi-left">
                <div className="e-big">
                  {enr.enrMwhJ.toFixed(1)} <span className="e-big-unit">MWh/j</span>
                </div>
                <div className="e-sub">Moy. journalière</div>
              </div>
              <div className="e-kpi-center">
                <div className="e-pct" style={{ color: '#00ab63' }}>{enr.ratioKwhKwc}</div>
                <div className="e-pct-arrow" style={{ color: 'var(--text-dim)' }}>kWh/kWc</div>
              </div>
              <div className="e-kpi-right">
                <div className="e-big">
                  {enr.totalCapMw.toFixed(1)} <span className="e-big-unit">MWc</span>
                </div>
                <div className="e-sub">Installés</div>
              </div>
            </div>
          </div>

          {/* Production cumulee / Mix EnR */}
          <div className="e-sec">
            <div className="e-sec-label" style={{ color: 'var(--text-dim)' }}>Production cumulée · Mix EnR</div>
            <div className="e-kpi-row">
              <div className="e-kpi-left">
                <div className="e-big" style={{ color: '#00ab63' }}>
                  {enr.cumulMwh.toLocaleString()} <span className="e-big-unit" style={{ color: 'var(--text-dim)' }}>MWh</span>
                </div>
                <div className="e-sub">{dateLabel}</div>
              </div>
              <div className="e-kpi-center">
                <div className="e-pct" style={{ color: '#00ab63' }}>{enr.mixPct.toFixed(2)}%</div>
                <div className="e-pct-arrow" style={{ color: 'var(--text-dim)' }}>moy. jour.</div>
              </div>
              <div className="e-kpi-right">
                <div className="e-big">
                  {enr.sitesCount} <span className="e-big-unit">sites</span>
                </div>
                <div className="e-sub">En production</div>
              </div>
            </div>
          </div>

          {/* Par site */}
          <div className="e-sec">
            <div className="e-sec-label" style={{ color: 'var(--text-dim)' }}>Par site</div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '4px' }}>
              {enr.sites.map((s, i) => {
                const colors = ['#00ab63', '#5aafaf', '#4a8fe7']
                const col = colors[i % colors.length]
                const fd = enr.siteFiltered[i]
                return (
                  <div key={s.code || i} style={{
                    flex: 1,
                    textAlign: 'center',
                    background: `${col}0d`,
                    borderRadius: '6px',
                    padding: '4px 6px',
                  }}>
                    <div style={{ fontSize: 'clamp(10px,1vw,15px)', fontWeight: 400, color: col }}>
                      {(fd.avgDailyKwh / 1000).toFixed(1)}
                    </div>
                    <div style={{ fontSize: 'clamp(6px,0.5vw,8px)', color: `${col}80` }}>
                      MWh/j
                    </div>
                    <div style={{ fontSize: 'clamp(6px,0.5vw,8px)', color: 'var(--text-dim)' }}>
                      {s.name}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* EnR Projets */}
        <div className="e-col-title e-col-title-proj" style={{ color: 'var(--text)' }}>Projets</div>
        <div
          className="capex-section-card e-card e-enr e-card-mini unified-card clickable-energy"
          onClick={() => navigate('/energy/enr-projets')}
        >
          {/* Row 1: Total + MWc + CAPEX */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', marginBottom: '10px' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '22px', fontWeight: 400, color: '#00ab63' }}>{enr.projectCount}</div>
              <div style={{ fontSize: '7px', color: 'var(--text-dim)', textTransform: 'uppercase' }}>projets</div>
            </div>
            <div style={{ width: '1px', height: '24px', background: 'rgba(0,171,99,0.15)' }}></div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '18px', fontWeight: 400, color: 'var(--text-secondary)' }}>{enr.totalMwcPipeline.toFixed(1)}</div>
              <div style={{ fontSize: '7px', color: 'var(--text-dim)', textTransform: 'uppercase' }}>MWc total</div>
            </div>
            <div style={{ width: '1px', height: '24px', background: 'rgba(0,171,99,0.15)' }}></div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '16px', fontWeight: 400, color: '#FDB823' }}>{enr.totalCapex.toFixed(1)}</div>
              <div style={{ fontSize: '7px', color: 'var(--text-dim)', textTransform: 'uppercase' }}>CAPEX M$</div>
            </div>
          </div>

          {/* Row 2: Phase badges */}
          <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', marginBottom: '8px' }}>
            <div style={{ background: 'rgba(0,171,99,0.1)', border: '1px solid rgba(0,171,99,0.25)', borderRadius: '6px', padding: '3px 8px', textAlign: 'center' }}>
              <span style={{ fontSize: '13px', fontWeight: 400, color: 'var(--text-secondary)' }}>{enr.grouped.termine.length}</span>
              <span style={{ fontSize: '7px', color: 'var(--text-dim)', marginLeft: '3px' }}>Terminé</span>
            </div>
            <div style={{ background: 'rgba(253,184,35,0.08)', border: '1px solid rgba(253,184,35,0.2)', borderRadius: '6px', padding: '3px 8px', textAlign: 'center' }}>
              <span style={{ fontSize: '13px', fontWeight: 400, color: 'var(--text-secondary)' }}>{enr.grouped.construction.length}</span>
              <span style={{ fontSize: '7px', color: 'var(--text-dim)', marginLeft: '3px' }}>Const.</span>
            </div>
            <div style={{ background: 'rgba(90,175,175,0.08)', border: '1px solid rgba(90,175,175,0.2)', borderRadius: '6px', padding: '3px 8px', textAlign: 'center' }}>
              <span style={{ fontSize: '13px', fontWeight: 400, color: 'var(--text-secondary)' }}>{enr.grouped.developpement.length}</span>
              <span style={{ fontSize: '7px', color: 'var(--text-dim)', marginLeft: '3px' }}>Dev.</span>
            </div>
            <div style={{ background: 'var(--inner-card)', border: '1px solid var(--inner-card-border)', borderRadius: '6px', padding: '3px 8px', textAlign: 'center' }}>
              <span style={{ fontSize: '13px', fontWeight: 400, color: 'var(--text-muted)' }}>{enr.grouped.planifie.length}</span>
              <span style={{ fontSize: '7px', color: 'var(--text-dim)', marginLeft: '3px' }}>Plan.</span>
            </div>
          </div>

          {/* Row 3: Alerts */}
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
            {enr.delayCount > 0 && (
              <div style={{ fontSize: '8px', color: 'var(--text-dim)' }}>
                ⚠ {enr.delayCount} en retard
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
    </div>
  )
}
