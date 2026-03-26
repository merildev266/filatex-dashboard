import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useFilters } from '../../hooks/useFilters'
import { TAMATAVE_LIVE, DIEGO_LIVE, MAJUNGA_LIVE, TULEAR_LIVE } from '../../data/site_data'
import { ENR_SITES } from '../../data/enr_site_data'
import { ENR_PROJECTS_DATA } from '../../data/enr_projects_data'
import { HFO_PROJECTS } from '../../data/hfo_projects'

// Merge live data for overview
const LIVE_SITES = {
  tamatave: TAMATAVE_LIVE,
  diego: DIEGO_LIVE,
  majunga: MAJUNGA_LIVE,
  tulear: TULEAR_LIVE,
}

const STATIC_SITES = {
  antsirabe: { name: 'Antsirabe', status: 'reconstruction', mw: 0, contrat: 7.5, groupes: [], kpi: {} },
  fihaonana: { name: 'Fihaonana', status: 'construction', mw: 0, contrat: 0, groupes: [], kpi: {} },
}

const ALL_SITES = { ...LIVE_SITES, ...STATIC_SITES }
const SITE_ORDER = ['tamatave', 'tulear', 'diego', 'majunga', 'antsirabe', 'fihaonana']

const MOIS_FR = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre']

function getKpiForSite(site, filter) {
  if (!site || !site.kpi) return {}
  const map = { 'J-1': '24h', 'M': 'month', 'Q': 'quarter', 'A': 'year' }
  const key = map[filter] || 'month'
  return site.kpi[key] || site.kpi['month'] || {}
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
  const { currentFilter } = useFilters()

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
      const k = getKpiForSite(s, currentFilter)
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
    const now = new Date()
    const dayOfMonth = now.getDate()
    const monthIdx = now.getMonth()
    const daysElapsed = currentFilter === 'A' ? dayOfMonth + monthIdx * 30
      : currentFilter === 'Q' ? dayOfMonth + 91
      : dayOfMonth
    const lostToDate = lostPerDay * daysElapsed

    // Period label
    const periodLabel = currentFilter === 'A' ? String(now.getFullYear())
      : currentFilter === 'Q' ? 'Q' + (Math.floor(monthIdx / 3) + 1)
      : MOIS_FR[monthIdx]

    return {
      totalMW, totalContrat, pctContrat,
      totalProd, totalProdObj, pctProd,
      avgSfoc, avgSloc,
      totalMoteurs, totalArret, lostToDate, periodLabel,
      urgents: HFO_PROJECTS?.urgents || 0,
      enCours: HFO_PROJECTS?.enCours || 0,
      projectCount: HFO_PROJECTS?.total || 0,
    }
  }, [currentFilter])

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

  // Hover handlers for cards
  const hfoHover = {
    onMouseEnter: (e) => {
      e.currentTarget.style.borderColor = 'rgba(138,146,171,0.7)'
      e.currentTarget.style.background = 'rgba(138,146,171,0.08)'
      e.currentTarget.style.boxShadow = '0 16px 40px rgba(138,146,171,0.25)'
      e.currentTarget.style.transform = 'translateY(-3px)'
    },
    onMouseLeave: (e) => {
      e.currentTarget.style.borderColor = 'rgba(138,146,171,0.35)'
      e.currentTarget.style.background = ''
      e.currentTarget.style.boxShadow = ''
      e.currentTarget.style.transform = ''
    },
  }
  const enrHover = {
    onMouseEnter: (e) => {
      e.currentTarget.style.borderColor = 'rgba(0,171,99,0.45)'
      e.currentTarget.style.background = 'rgba(0,171,99,0.06)'
      e.currentTarget.style.boxShadow = '0 16px 40px rgba(0,171,99,0.15)'
      e.currentTarget.style.transform = 'translateY(-3px)'
    },
    onMouseLeave: (e) => {
      e.currentTarget.style.borderColor = 'rgba(0,171,99,0.15)'
      e.currentTarget.style.background = ''
      e.currentTarget.style.boxShadow = ''
      e.currentTarget.style.transform = ''
    },
  }

  const pctContratColor = hfo.pctContrat >= 100 ? 'rgba(0,171,99,0.9)' : 'rgba(243,112,86,0.9)'
  const pctContratArrow = hfo.pctContrat >= 100 ? '▲ du contrat' : '▼ du contrat'
  const pctProdColor = hfo.pctProd >= 100 ? 'rgba(0,171,99,0.9)' : 'rgba(243,112,86,0.9)'
  const pctProdArrow = hfo.pctProd >= 100 ? '▲ vs prévu' : '▼ vs prévu'
  const arretColor = hfo.totalArret === 0 ? 'rgba(0,171,99,0.9)' : 'rgba(243,112,86,0.9)'

  return (
    <div className="e-wrap page-energy-wrap">

      {/* ═══ COLONNE GAUCHE - HFO ═══ */}
      <div className="e-col">
        <div className="e-col-title" style={{ color: 'var(--text-dim)' }}>HFO</div>

        {/* HFO Production card */}
        <div
          className="capex-section-card e-card"
          onClick={() => navigate('/energy/hfo')}
          style={{ borderColor: 'rgba(138,146,171,0.35)' }}
          {...hfoHover}
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
                <div className="e-mid" style={{ color: 'rgba(243,112,86,0.8)' }}>
                  {hfo.totalArret > 0 ? '\u2212' + hfo.lostToDate.toLocaleString() : '0'}{' '}
                  <span className="e-mid-unit" style={{ color: 'rgba(243,112,86,0.5)' }}>MWh</span>
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
          className="capex-section-card e-card e-card-mini"
          onClick={() => navigate('/energy/hfo-projets')}
          style={{ borderColor: 'rgba(138,146,171,0.35)', cursor: 'pointer' }}
          {...hfoHover}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text)' }}>{hfo.projectCount}</div>
              <div style={{ fontSize: '7px', color: 'var(--text-dim)', textTransform: 'uppercase' }}>projets</div>
            </div>
            <div style={{ width: '1px', height: '24px', background: 'rgba(138,146,171,0.15)' }}></div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '18px', fontWeight: 700, color: 'rgba(243,112,86,0.9)' }}>{hfo.urgents}</div>
              <div style={{ fontSize: '7px', color: 'rgba(243,112,86,0.5)', textTransform: 'uppercase' }}>urgent</div>
            </div>
            <div style={{ width: '1px', height: '24px', background: 'rgba(138,146,171,0.15)' }}></div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '18px', fontWeight: 700, color: 'rgba(253,184,35,0.8)' }}>{hfo.enCours}</div>
              <div style={{ fontSize: '7px', color: 'rgba(253,184,35,0.5)', textTransform: 'uppercase' }}>en cours</div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ COLONNE DROITE - EnR ═══ */}
      <div className="e-col">
        <div className="e-col-title" style={{ color: '#00ab63' }}>EnR</div>

        {/* EnR Production card */}
        <div
          className="capex-section-card e-card e-enr"
          onClick={() => navigate('/energy/enr')}
          style={{ borderColor: 'rgba(0,171,99,0.15)' }}
          {...enrHover}
        >
          {/* Production moyenne vs Capacite */}
          <div className="e-sec">
            <div className="e-sec-label" style={{ color: 'rgba(0,171,99,0.55)' }}>Production moyenne vs Capacité</div>
            <div className="e-kpi-row">
              <div className="e-kpi-left">
                <div className="e-big">
                  {enr.enrMwhJ.toFixed(1)} <span className="e-big-unit">MWh/j</span>
                </div>
                <div className="e-sub">Moy. journalière</div>
              </div>
              <div className="e-kpi-center">
                <div className="e-pct" style={{ color: '#00ab63' }}>{enr.ratioKwhKwc}</div>
                <div className="e-pct-arrow" style={{ color: 'rgba(0,171,99,0.5)' }}>kWh/kWc</div>
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
            <div className="e-sec-label" style={{ color: 'rgba(0,171,99,0.55)' }}>Production cumulée · Mix EnR</div>
            <div className="e-kpi-row">
              <div className="e-kpi-left">
                <div className="e-big" style={{ color: '#00ab63' }}>
                  {enr.cumulMwh.toLocaleString()} <span className="e-big-unit" style={{ color: 'rgba(0,171,99,0.5)' }}>MWh</span>
                </div>
                <div className="e-sub">Depuis janvier</div>
              </div>
              <div className="e-kpi-center">
                <div className="e-pct" style={{ color: '#00ab63' }}>{enr.mixPct.toFixed(2)}%</div>
                <div className="e-pct-arrow" style={{ color: 'rgba(0,171,99,0.5)' }}>moy. jour.</div>
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
            <div className="e-sec-label" style={{ color: 'rgba(0,171,99,0.55)' }}>Par site</div>
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
                    <div style={{ fontSize: 'clamp(10px,1vw,15px)', fontWeight: 800, color: col }}>
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
        <div className="e-col-title e-col-title-proj" style={{ color: '#00ab63' }}>Projets</div>
        <div
          className="capex-section-card e-card e-enr e-card-mini"
          onClick={() => navigate('/energy/enr-projets')}
          style={{ borderColor: 'rgba(0,171,99,0.15)', cursor: 'pointer' }}
          {...enrHover}
        >
          {/* Row 1: Total + MWc + CAPEX */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', marginBottom: '10px' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '22px', fontWeight: 800, color: '#00ab63' }}>{enr.projectCount}</div>
              <div style={{ fontSize: '7px', color: 'rgba(0,171,99,0.5)', textTransform: 'uppercase' }}>projets</div>
            </div>
            <div style={{ width: '1px', height: '24px', background: 'rgba(0,171,99,0.15)' }}></div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-secondary)' }}>{enr.totalMwcPipeline.toFixed(1)}</div>
              <div style={{ fontSize: '7px', color: 'rgba(0,171,99,0.4)', textTransform: 'uppercase' }}>MWc total</div>
            </div>
            <div style={{ width: '1px', height: '24px', background: 'rgba(0,171,99,0.15)' }}></div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '16px', fontWeight: 700, color: '#FDB823' }}>{enr.totalCapex.toFixed(1)}</div>
              <div style={{ fontSize: '7px', color: 'rgba(253,184,35,0.5)', textTransform: 'uppercase' }}>CAPEX M$</div>
            </div>
          </div>

          {/* Row 2: Phase badges */}
          <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', marginBottom: '8px' }}>
            <div style={{ background: 'rgba(0,171,99,0.1)', border: '1px solid rgba(0,171,99,0.25)', borderRadius: '6px', padding: '3px 8px', textAlign: 'center' }}>
              <span style={{ fontSize: '13px', fontWeight: 800, color: 'rgba(0,171,99,0.8)' }}>{enr.grouped.termine.length}</span>
              <span style={{ fontSize: '7px', color: 'rgba(0,171,99,0.5)', marginLeft: '3px' }}>Terminé</span>
            </div>
            <div style={{ background: 'rgba(253,184,35,0.08)', border: '1px solid rgba(253,184,35,0.2)', borderRadius: '6px', padding: '3px 8px', textAlign: 'center' }}>
              <span style={{ fontSize: '13px', fontWeight: 800, color: 'rgba(253,184,35,0.8)' }}>{enr.grouped.construction.length}</span>
              <span style={{ fontSize: '7px', color: 'rgba(253,184,35,0.5)', marginLeft: '3px' }}>Const.</span>
            </div>
            <div style={{ background: 'rgba(90,175,175,0.08)', border: '1px solid rgba(90,175,175,0.2)', borderRadius: '6px', padding: '3px 8px', textAlign: 'center' }}>
              <span style={{ fontSize: '13px', fontWeight: 800, color: 'rgba(90,175,175,0.8)' }}>{enr.grouped.developpement.length}</span>
              <span style={{ fontSize: '7px', color: 'rgba(90,175,175,0.5)', marginLeft: '3px' }}>Dev.</span>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', padding: '3px 8px', textAlign: 'center' }}>
              <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-muted)' }}>{enr.grouped.planifie.length}</span>
              <span style={{ fontSize: '7px', color: 'var(--text-dim)', marginLeft: '3px' }}>Plan.</span>
            </div>
          </div>

          {/* Row 3: Alerts */}
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
            {enr.delayCount > 0 && (
              <div style={{ fontSize: '8px', color: 'rgba(243,112,86,0.7)' }}>
                ⚠ {enr.delayCount} en retard
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  )
}
