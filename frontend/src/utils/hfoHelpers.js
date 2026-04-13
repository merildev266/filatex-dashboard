export const MOIS_FR = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre']

/** Get KPI for a given filter + selected period */
export function getKpiForSite(site, filter, selectedMonthIndex, selectedQuarter, selectedYear) {
  if (!site || !site.kpi) return {}
  if (filter === 'J-1') return site.kpi['24h'] || {}
  if (filter === 'A') return site.kpi['year'] || {}
  if (filter === 'M') {
    const monthKey = `month_${selectedMonthIndex + 1}`
    return site.kpi[monthKey] || site.kpi['month'] || {}
  }
  if (filter === 'Q') {
    const startM = (selectedQuarter - 1) * 3
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
      dispo: prodObj > 0 ? (prod / prodObj * 100) : 0,
      sfoc: prod > 0 ? sfocW / prod : 0,
      sloc: prod > 0 ? slocW / prod : 0,
    }
  }
  return site.kpi['month'] || {}
}
