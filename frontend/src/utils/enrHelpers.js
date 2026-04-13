import { MONTH_NAMES } from './projects'

/**
 * Filter ENR site data by the global time filter (J-1/M/Q/A).
 * Returns { prodKwh, deliveredKwh, consumedKwh, peakKw, avgDailyKwh, days, label }
 */
export function getFilteredEnrSite(site, currentFilter, selectedMonthIndex, selectedQuarter, selectedYear) {
  const result = { prodKwh: 0, deliveredKwh: 0, consumedKwh: 0, peakKw: 0, avgDailyKwh: 0, days: 0, label: '' }

  if (currentFilter === 'M' || currentFilter === 'J-1') {
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
