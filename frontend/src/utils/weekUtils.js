// ISO 8601 week helpers — Semaine lundi-dimanche, S1 = semaine du 1er jeudi de l'année.

const MOIS_ABBR = ['jan','fév','mar','avr','mai','jun','jul','aoû','sep','oct','nov','déc']

/** Retourne { year, week } ISO 8601 pour une date donnée. */
export function getIsoWeek(date) {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const dayNum = d.getDay() || 7 // Mon=1..Sun=7
  d.setDate(d.getDate() + 4 - dayNum) // Jeudi de la meme semaine ISO
  const isoYear = d.getFullYear()
  const jan4 = new Date(isoYear, 0, 4)
  const jan4Dow = jan4.getDay() || 7
  const mondayWeek1 = new Date(isoYear, 0, 4 - jan4Dow + 1)
  const week = Math.round((d - mondayWeek1) / (7 * 86400000)) + 1
  return { year: isoYear, week }
}

/** Lundi (00:00 local) de la semaine ISO donnee. */
export function isoWeekMonday(year, week) {
  const jan4 = new Date(year, 0, 4)
  const jan4Dow = jan4.getDay() || 7
  const mondayWeek1 = new Date(year, 0, 4 - jan4Dow + 1)
  const d = new Date(mondayWeek1)
  d.setDate(mondayWeek1.getDate() + (week - 1) * 7)
  d.setHours(0, 0, 0, 0)
  return d
}

/** { start: lundi, end: dimanche } pour la semaine ISO. */
export function isoWeekRange(year, week) {
  const start = isoWeekMonday(year, week)
  const end = new Date(start)
  end.setDate(start.getDate() + 6)
  end.setHours(23, 59, 59, 999)
  return { start, end }
}

/**
 * Liste des semaines ISO qui intersectent un mois (monthIndex 0..11).
 * Renvoie [{ week, year, start, end, label, rangeLabel }, ...].
 */
export function weeksInMonth(year, monthIndex) {
  const firstOfMonth = new Date(year, monthIndex, 1)
  const lastOfMonth = new Date(year, monthIndex + 1, 0)
  const out = []
  const seen = new Set()
  const day = new Date(firstOfMonth)
  while (day <= lastOfMonth) {
    const { year: wy, week: wn } = getIsoWeek(day)
    const key = `${wy}-${wn}`
    if (!seen.has(key)) {
      seen.add(key)
      const { start, end } = isoWeekRange(wy, wn)
      // Portion de la semaine qui tombe dans le mois selectionne
      const fdim = start < firstOfMonth ? new Date(firstOfMonth) : new Date(start)
      fdim.setHours(0, 0, 0, 0)
      const ldim = end > lastOfMonth ? new Date(lastOfMonth) : new Date(end)
      ldim.setHours(0, 0, 0, 0)
      out.push({
        week: wn,
        year: wy,
        start,
        end,
        firstDayInMonth: fdim,
        lastDayInMonth: ldim,
        label: `S${wn}`,
        rangeLabel: formatWeekRange(fdim, ldim),
      })
    }
    day.setDate(day.getDate() + 1)
  }
  return out
}

/** { year, week } de la semaine ISO du jour courant. */
export function currentIsoWeek() {
  return getIsoWeek(new Date())
}

/** "13-19 avr" ou "30 mar – 5 avr" si le mois change. */
export function formatWeekRange(start, end) {
  const sd = start.getDate(), sm = MOIS_ABBR[start.getMonth()]
  const ed = end.getDate(),   em = MOIS_ABBR[end.getMonth()]
  if (sm === em) return `${sd}-${ed} ${sm}`
  return `${sd} ${sm} – ${ed} ${em}`
}

/** Liste des dates (YYYY-MM-DD) couvertes par une semaine ISO [start..end]. */
export function daysBetween(start, end) {
  const out = []
  const d = new Date(start)
  d.setHours(0, 0, 0, 0)
  const stop = new Date(end)
  stop.setHours(0, 0, 0, 0)
  while (d <= stop) {
    out.push({
      date: d.toISOString().slice(0, 10),
      y: d.getFullYear(),
      m: d.getMonth() + 1,
      d: d.getDate(),
    })
    d.setDate(d.getDate() + 1)
  }
  return out
}

/**
 * Retourne les 7 dates (YYYY-MM-DD) d'une semaine ISO donnee.
 * Utile pour iterer sur les donnees journalieres.
 */
export function isoWeekDays(year, week) {
  const { start, end } = isoWeekRange(year, week)
  return daysBetween(start, end)
}
