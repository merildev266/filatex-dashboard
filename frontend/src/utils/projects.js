/**
 * Gantt / Timeline utilities for project display.
 */

const MONTH_NAMES = ['Janvier','Fevrier','Mars','Avril','Mai','Juin','Juillet','Aout','Septembre','Octobre','Novembre','Decembre']
const MONTH_SHORT = ['Jan','Fev','Mar','Avr','Mai','Jun','Jul','Aou','Sep','Oct','Nov','Dec']

/**
 * Calculate the number of days between two dates.
 */
export function daysBetween(d1, d2) {
  if (!d1 || !d2) return null
  const a = new Date(d1)
  const b = new Date(d2)
  return Math.round((b - a) / (1000 * 60 * 60 * 24))
}

/**
 * Format a date string (YYYY-MM-DD) to DD/MM/YYYY.
 */
export function formatDateFR(dateStr) {
  if (!dateStr) return '—'
  const parts = dateStr.split('-')
  if (parts.length !== 3) return dateStr
  return `${parts[2]}/${parts[1]}/${parts[0]}`
}

/**
 * Get month name (French).
 */
export function getMonthName(idx) {
  return MONTH_NAMES[idx] || ''
}

/**
 * Get month short name.
 */
export function getMonthShort(idx) {
  return MONTH_SHORT[idx] || ''
}

/**
 * Calculate glissement (slippage) in days from initial to revised deadline.
 */
export function calcGlissement(dlInit, dlRevu) {
  if (!dlInit || !dlRevu) return null
  return daysBetween(dlInit, dlRevu)
}

/**
 * Calculate days remaining until a deadline.
 */
export function daysToGo(deadline) {
  if (!deadline) return null
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return daysBetween(today.toISOString().slice(0, 10), deadline)
}

/**
 * Status label map for HFO projects.
 */
export const HFO_STATUS_LABELS = {
  urgent: 'Urgent',
  en_cours: 'En cours',
  termine: 'Termine',
  indefini: 'Indefini',
}

export const HFO_STATUS_COLORS = {
  urgent: '#f37056',
  en_cours: '#FDB823',
  termine: '#00ab63',
  indefini: 'rgba(138,146,171,0.5)',
}

export const HFO_CAT_LABELS = {
  overhaul: 'Overhaul',
  remise: 'Remise en service',
  maintenance: 'Maintenance',
  scada: 'SCADA',
  installation: 'Installation',
  autre: 'Autre',
}

export { MONTH_NAMES, MONTH_SHORT }
