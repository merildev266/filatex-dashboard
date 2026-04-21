import { MONTH_NAMES } from './projects'
import { isoWeekDays } from './weekUtils'

/**
 * Filter ENR site data by the global time filter (S/M/Q/A).
 * Returns { prodKwh, deliveredKwh, consumedKwh, peakKw, avgDailyKwh, days, label }
 */
export function getFilteredEnrSite(site, currentFilter, selectedMonthIndex, selectedQuarter, selectedYear, selectedWeek, selectedWeekYear) {
  const result = { prodKwh: 0, deliveredKwh: 0, consumedKwh: 0, peakKw: 0, avgDailyKwh: 0, days: 0, label: '' }

  if (currentFilter === 'S') {
    // Semaine ISO : on agrege les jours disponibles dans site.daily (si expose),
    // sinon on retombe sur les totaux mensuels proportionnels (approximation).
    const wy = selectedWeekYear || selectedYear
    const days = isoWeekDays(wy, selectedWeek)
    const set = new Set(days.map(d => d.date))
    const daily = Array.isArray(site.daily) ? site.daily : []
    if (daily.length) {
      let prod = 0, del = 0, con = 0, peak = 0, n = 0
      for (const r of daily) {
        if (!r?.date || !set.has(r.date)) continue
        prod += +(r.totalProdKwh || r.prodKwh || 0)
        del  += +(r.totalDeliveredKwh || r.deliveredKwh || 0)
        con  += +(r.totalConsumedKwh || r.consumedKwh || 0)
        if ((r.maxPeakKw || 0) > peak) peak = r.maxPeakKw || 0
        n++
      }
      result.prodKwh = prod; result.deliveredKwh = del; result.consumedKwh = con
      result.peakKw = peak; result.avgDailyKwh = n > 0 ? prod / n : 0; result.days = n
    }
    result.label = `S${selectedWeek} ${wy}`
    return result
  }

  if (currentFilter === 'M') {
    const mi = selectedMonthIndex
    const monthStr = selectedYear + '-' + String(mi + 1).padStart(2, '0')
    for (let i = 0; i < site.monthly.length; i++) {
      if (site.monthly[i].month === monthStr) {
        const m = site.monthly[i]
        result.prodKwh = m.totalProdKwh
        result.deliveredKwh = m.totalDeliveredKwh
        result.consumedKwh = m.totalConsumedKwh
        result.peakKw = m.maxPeakKw
        result.avgDailyKwh = m.avgDailyProdKwh
        result.days = m.daysWithData
        result.label = MONTH_NAMES[mi] + ' ' + selectedYear
        break
      }
    }
    return result
  }

  if (currentFilter === 'Q') {
    const startMonth = (selectedQuarter - 1) * 3 + 1
    const endMonth = startMonth + 2
    let totalProd = 0, totalDel = 0, totalCon = 0, maxPeak = 0, totalDays = 0
    site.monthly.forEach(m => {
      const mNum = parseInt(m.month.split('-')[1])
      const mYear = parseInt(m.month.split('-')[0])
      if (mYear === selectedYear && mNum >= startMonth && mNum <= endMonth) {
        totalProd += m.totalProdKwh; totalDel += m.totalDeliveredKwh; totalCon += m.totalConsumedKwh
        if (m.maxPeakKw > maxPeak) maxPeak = m.maxPeakKw; totalDays += m.daysWithData
      }
    })
    result.prodKwh = totalProd; result.deliveredKwh = totalDel; result.consumedKwh = totalCon
    result.peakKw = maxPeak; result.avgDailyKwh = totalDays > 0 ? totalProd / totalDays : 0
    result.days = totalDays; result.label = 'Q' + selectedQuarter + ' ' + selectedYear
    return result
  }

  // A (year)
  let totalProd = 0, totalDel = 0, totalCon = 0, maxPeak = 0, totalDays = 0
  site.monthly.forEach(m => {
    const mYear = parseInt(m.month.split('-')[0])
    if (mYear === selectedYear) {
      totalProd += m.totalProdKwh; totalDel += m.totalDeliveredKwh; totalCon += m.totalConsumedKwh
      if (m.maxPeakKw > maxPeak) maxPeak = m.maxPeakKw; totalDays += m.daysWithData
    }
  })
  result.prodKwh = totalProd; result.deliveredKwh = totalDel; result.consumedKwh = totalCon
  result.peakKw = maxPeak; result.avgDailyKwh = totalDays > 0 ? totalProd / totalDays : 0
  result.days = totalDays; result.label = String(selectedYear)
  return result
}
