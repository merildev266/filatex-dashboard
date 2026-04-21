import { isoWeekDays } from './weekUtils'

export const MOIS_FR = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre']

/**
 * KPI agrege sur une plage de dates (inclusif) a partir de site.dailyTrend.
 * dailyTrend rows: { date: 'YYYY-MM-DD', net_mwh, gross_mwh, sfoc, sloc, run_hours }
 */
function aggregateDailyKpi(site, dateSet) {
  const trend = Array.isArray(site?.dailyTrend) ? site.dailyTrend : []
  let prod = 0, heures = 0, sfocW = 0, slocW = 0
  for (const r of trend) {
    if (!r || !r.date || !dateSet.has(r.date)) continue
    const p = +(r.net_mwh || r.gross_mwh || 0)
    prod += p
    heures += +(r.run_hours || 0)
    if (r.sfoc && p) sfocW += r.sfoc * p
    if (r.sloc && p) slocW += r.sloc * p
  }
  return {
    prod, prodObj: 0, heures,
    dispo: 0,
    sfoc: prod > 0 ? sfocW / prod : 0,
    sloc: prod > 0 ? slocW / prod : 0,
  }
}

/** Get KPI for a given filter + selected period */
export function getKpiForSite(site, filter, selectedMonthIndex, selectedQuarter, selectedYear, selectedWeek, selectedWeekYear) {
  if (!site || !site.kpi) return {}
  if (filter === 'A') return site.kpi['year'] || {}
  if (filter === 'M') {
    const monthKey = `month_${selectedMonthIndex + 1}`
    return site.kpi[monthKey] || site.kpi['month'] || {}
  }
  if (filter === 'S') {
    if (selectedWeek == null) return {}
    const days = isoWeekDays(selectedWeekYear || selectedYear, selectedWeek)
    const set = new Set(days.map(d => d.date))
    return aggregateDailyKpi(site, set)
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
