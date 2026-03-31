/**
 * Gantt / Timeline utilities for project display.
 */

const MONTH_NAMES = ['Janvier','Fevrier','Mars','Avril','Mai','Juin','Juillet','Aout','Septembre','Octobre','Novembre','Decembre']
const MONTH_SHORT = ['Jan','Fev','Mar','Avr','Mai','Jun','Jul','Aou','Sep','Oct','Nov','Dec']

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
