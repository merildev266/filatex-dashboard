import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useFilters } from '../../hooks/useFilters'
import { useEnergyData } from '../../hooks/useEnergyData'

const STATIC_SITES = {
  antsirabe: { name: 'Antsirabe', status: 'reconstruction', mw: 0, contrat: 7.5, groupes: [], kpi: {} },
  fihaonana: { name: 'Fihaonana', status: 'construction', mw: 0, contrat: 0, groupes: [], kpi: {} },
}

const SITE_ORDER = ['tamatave', 'tulear', 'diego', 'majunga', 'antsirabe', 'fihaonana']
const LIVE_IDS = ['tamatave', 'diego', 'majunga', 'tulear']

const MOIS_FR = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre']

/** Get the last day (1-based) where ALL 4 live sites have data */
function getLastDayAllSites(liveSites) {
  let minDay = 31
  LIVE_IDS.forEach(id => {
    const site = liveSites[id]
    if (!site?.latestDate) return
    const d = new Date(site.latestDate)
    const day = d.getDate()
    if (day < minDay) minDay = day
  })
  return minDay
}

/** Get KPI for a given filter + selected period */
function getKpiForSite(site, filter, selectedMonthIndex, selectedQuarter, selectedYear) {
  if (!site || !site.kpi) return {}
  if (filter === 'J-1') return site.kpi['24h'] || {}
  if (filter === 'A') return site.kpi['year'] || {}
  if (filter === 'M') {
    // Use month_N (1-based) for the selected month
    const monthKey = `month_${selectedMonthIndex + 1}`
    return site.kpi[monthKey] || site.kpi['month'] || {}
  }
  if (filter === 'Q') {
    // Aggregate months in the quarter
    const startM = (selectedQuarter - 1) * 3 // 0-based
    let prod = 0, prodObj = 0, heures = 0, sfocW = 0, slocW = 0
    for (let m = startM; m < startM + 3; m++) {
      const mk = `month_${m + 1}`
      const k = site.kpi[mk] || {}
      prod += k.prod || 0
      prodObj += k.prodObj || 0
      heures += k.heures || 0
      if (k.sfoc && k.prod) sfocW += k.sfoc * k.prod
      if (k.sloc && k.prod) slocW += k.sloc * k.prod
    }
    return {
      prod, prodObj, heures,
      dispo: prod > 0 ? (prod / prodObj * 100) : 0,
      sfoc: prod > 0 ? sfocW / prod : 0,
      sloc: prod > 0 ? slocW / prod : 0,
    }
  }
  return site.kpi['month'] || {}
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
  const { currentFilter, selectedMonthIndex, selectedQuarter, selectedYear } = useFilters()
  const { hfoSites, enrSites, hfoProjects, enrProjects, loading } = useEnergyData()

  // Extract data from hook (same variable names as before)
  const TAMATAVE_LIVE = hfoSites?.TAMATAVE_LIVE
  const DIEGO_LIVE = hfoSites?.DIEGO_LIVE
  const MAJUNGA_LIVE = hfoSites?.MAJUNGA_LIVE
  const TULEAR_LIVE = hfoSites?.TULEAR_LIVE
  const LIVE_SITES = { tamatave: TAMATAVE_LIVE, diego: DIEGO_LIVE, majunga: MAJUNGA_LIVE, tulear: TULEAR_LIVE }
  const ALL_SITES = { ...LIVE_SITES, ...STATIC_SITES }
  const ENR_SITES = enrSites?.ENR_SITES || []
  const ENR_PROJECTS_DATA = enrProjects?.ENR_PROJECTS_DATA || { projects: [] }
  const HFO_PROJECTS = hfoProjects?.HFO_PROJECTS || { projects: [] }

  // Last day with data for all 4 sites (for J-1 display)
  const lastDayAll = useMemo(() => getLastDayAllSites(LIVE_SITES), [TAMATAVE_LIVE, DIEGO_LIVE, MAJUNGA_LIVE, TULEAR_LIVE])

  // Date display
  const dateLabel = useMemo(() => {
    const now = new Date()
    if (currentFilter === 'J-1') {
      // Show the actual last day with data for all sites
      const d = new Date(now.getFullYear(), now.getMonth(), lastDayAll)
      return d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })
    }
    if (currentFilter === 'M') return MOIS_FR[selectedMonthIndex] + ' ' + selectedYear
    if (currentFilter === 'Q') return 'Q' + selectedQuarter + ' ' + selectedYear
    if (currentFilter === 'A') return String(selectedYear)
    return ''
  }, [currentFilter, selectedMonthIndex, selectedQuarter, selectedYear, lastDayAll])

  // HFO aggregates
  const hfo = useMemo(() => {
    let totalMW = 0, totalContrat = 0, totalProd = 0, totalProdObj = 0
    let totalMoteurs = 0, totalArret = 0, arretMW = 0
    let sfocWeighted = 0, slocWeighted = 0

    SITE_ORDER.forEach(id => {
      const s = ALL_SITES[id]
      if (!s || s.status === 'construction' || s.status === 'reconstruction') return
      totalMW += s.mw || 0
      totalContrat += s.contrat || 0
      if (s.groupes) {
        totalMoteurs += s.groupes.length
        s.groupes.forEach(g => {
          if (g.statut !== 'ok') { totalArret++; arretMW += g.mw || 0 }
        })
      }
      const k = getKpiForSite(s, currentFilter, selectedMonthIndex, selectedQuarter, selectedYear)
      totalProd += k.prod || 0
      totalProdObj += k.prodObj || 0
      if (k.sfoc && k.prod) sfocWeighted += k.sfoc * k.prod
      if (k.sloc && k.prod) slocWeighted += k.sloc * k.prod
    })

    const pctContrat = totalContrat > 0 ? ((totalMW / totalContrat) * 100) : 0
    const pctProd = totalProdObj > 0 ? ((totalProd / totalProdObj) * 100) : 0
    const avgSfoc = totalProd > 0 ? (sfocWeighted / totalProd) : 0
    const avgSloc = totalProd > 0 ? (slocWeighted / totalProd) : 0

    // Lost MWh estimate
    const lostPerDay = Math.round(arretMW * 24)
    const dayOfMonth = new Date().getDate()
    const daysElapsed = currentFilter === 'A' ? dayOfMonth + selectedMonthIndex * 30
      : currentFilter === 'Q' ? dayOfMonth + 91
      : dayOfMonth
    const lostToDate = lostPerDay * daysElapsed

    // Period label
    const periodLabel = currentFilter === 'A' ? String(selectedYear)
      : currentFilter === 'Q' ? 'Q' + selectedQuarter
      : MOIS_FR[selectedMonthIndex]

    return {
      totalMW, totalContrat, pctContrat,
      totalProd, totalProdObj, pctProd,
      avgSfoc, avgSloc,
      totalMoteurs, totalArret, lostToDate, periodLabel,
      urgents: HFO_PROJECTS?.urgents || 0,
      enCours: HFO_PROJECTS?.enCours || 0,
      projectCount: HFO_PROJECTS?.total || 0,
    }
  }, [currentFilter, selectedMonthIndex, selectedQuarter, selectedYear])

  // ENR aggregates
  const enr = useMemo(() => {
    const sites = ENR_SITES || []
    const projects = ENR_PROJECTS_DATA?.projects || []

    // Production aggregates
    let totalCapKwc = 0, totalAvgKwh = 0, totalProdKwh = 0
    sites.forEach(s => {
      totalCapKwc += s.capacityKwc || 0
      totalAvgKwh += s.avgDailyKwh || 0
      totalProdKwh += s.totalProdKwh || 0
    })
    const totalCapMw = totalCapKwc / 1000
    const enrMwhJ = totalAvgKwh / 1000
    const ratioKwhKwc = totalCapKwc > 0 ? (totalAvgKwh / totalCapKwc).toFixed(2) : '\u2014'
    const cumulMwh = Math.round(totalProdKwh / 1000)

    // Mix calculation (avg daily)
    let totalHfoAvgDaily = 0
    SITE_ORDER.forEach(id => {
      const s = ALL_SITES[id]
      if (!s || s.status === 'construction' || s.status === 'reconstruction') return
      const k = getKpiForSite(s, 'M')
      if (k.prod) {
        const now = new Date()
        totalHfoAvgDaily += k.prod / now.getDate()
      }
    })
    const totalDaily = totalHfoAvgDaily + (totalAvgKwh / 1000)
    const mixPct = totalDaily > 0 ? ((totalAvgKwh / 1000) / totalDaily * 100) : 0

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
      sites, sitesCount: sites.length,
      mixPct,
      projectCount: projects.length,
      totalMwcPipeline, totalCapex,
      grouped, delayCount,
    }
  }, [currentFilter])

  if (loading) return <div className="e-loading"><div className="e-spinner" /><span>Chargement des données Energy...</span></div>

  const pctContratColor = hfo.pctContrat >= 100 ? 'rgba(0,171,99,0.9)' : 'rgba(243,112,86,0.9)'
  const pctContratArrow = hfo.pctContrat >= 100 ? '▲ du contrat' : '▼ du contrat'
  const pctProdColor = hfo.pctProd >= 100 ? 'rgba(0,171,99,0.9)' : 'rgba(243,112,86,0.9)'
  const pctProdArrow = hfo.pctProd >= 100 ? '▲ vs prévu' : '▼ vs prévu'
  const arretColor = hfo.totalArret === 0 ? 'rgba(0,171,99,0.9)' : 'rgba(243,112,86,0.9)'

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
          {/* Puissance dispo vs Contractuel */}
          <div className="e-sec">
            <div className="e-sec-label">Puissance dispo vs Contractuel</div>
            <div className="e-kpi-row">
              <div className="e-kpi-left">
                <div className="e-big">
                  {hfo.totalMW.toFixed(1)} <span className="e-big-unit">MW</span>
                </div>
                <div className="e-sub">Disponible</div>
              </div>
              <div className="e-kpi-center">
                <div className="e-pct" style={{ color: pctContratColor }}>{hfo.pctContrat.toFixed(0)}%</div>
                <div className="e-pct-arrow" style={{ color: pctContratColor }}>{pctContratArrow}</div>
              </div>
              <div className="e-kpi-right">
                <div className="e-big">
                  {hfo.totalContrat.toFixed(0)} <span className="e-big-unit">MW</span>
                </div>
                <div className="e-sub">Contractuel</div>
              </div>
            </div>
          </div>

          {/* Production a date vs Previsionnelle */}
          <div className="e-sec">
            <div className="e-sec-label">Production à date vs Prévisionnelle</div>
            <div className="e-kpi-row">
              <div className="e-kpi-left">
                <div className="e-big">
                  {Math.round(hfo.totalProd).toLocaleString()} <span className="e-big-unit">MWh</span>
                </div>
                <div className="e-sub">Réel</div>
              </div>
              <div className="e-kpi-center">
                <div className="e-pct" style={{ color: pctProdColor }}>{hfo.pctProd.toFixed(0)}%</div>
                <div className="e-pct-arrow" style={{ color: pctProdColor }}>{pctProdArrow}</div>
              </div>
              <div className="e-kpi-right">
                <div className="e-big">
                  {Math.round(hfo.totalProdObj).toLocaleString()} <span className="e-big-unit">MWh</span>
                </div>
                <div className="e-sub">Prévisionnel</div>
              </div>
            </div>
          </div>

          {/* SFOC / SLOC */}
          <div className="e-sec">
            <div className="e-sec-label">SFOC · SLOC (pondérés par production)</div>
            <div className="e-kpi-row">
              <div className="e-kpi-left">
                <div className="e-big">
                  {hfo.avgSfoc > 0 ? hfo.avgSfoc.toFixed(1) : '\u2014'} <span className="e-big-unit">g/kWh</span>
                </div>
                <div className="e-sub">SFOC moyen</div>
              </div>
              <div className="e-kpi-center"><div className="e-kpi-sep"></div></div>
              <div className="e-kpi-right">
                <div className="e-big">
                  {hfo.avgSloc > 0 ? hfo.avgSloc.toFixed(1) : '\u2014'} <span className="e-big-unit">g/kWh</span>
                </div>
                <div className="e-sub">SLOC moyen</div>
              </div>
            </div>
          </div>

          {/* Moteurs a l'arret */}
          <div className="e-sec">
            <div className="e-sec-label">Moteurs à l'arrêt</div>
            <div className="e-kpi-row">
              <div className="e-kpi-left">
                <div className="e-arret-num" style={{ color: arretColor }}>{hfo.totalArret}</div>
                <div className="e-arret-sub">/ {hfo.totalMoteurs} moteurs</div>
              </div>
              <div className="e-kpi-center"><div className="e-kpi-sep"></div></div>
              <div className="e-kpi-right">
                <div className="e-mid" style={{ color: 'var(--text-secondary)' }}>
                  {hfo.totalArret > 0 ? '\u2212' + hfo.lostToDate.toLocaleString() : '0'}{' '}
                  <span className="e-mid-unit" style={{ color: 'var(--text-dim)' }}>MWh</span>
                </div>
                <div className="e-arret-sub2" style={{ fontSize: 'clamp(7px,0.6vw,10px)', color: 'var(--text-dim)', marginTop: '1px' }}>
                  manque · {hfo.periodLabel}
                </div>
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
                <div className="e-sub">Depuis janvier</div>
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
                return (
                  <div key={s.code || i} style={{
                    flex: 1,
                    textAlign: 'center',
                    background: `${col}0d`,
                    borderRadius: '6px',
                    padding: '4px 6px',
                  }}>
                    <div style={{ fontSize: 'clamp(10px,1vw,15px)', fontWeight: 400, color: col }}>
                      {(s.avgDailyKwh / 1000).toFixed(1)}
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
