export const MONTH_NAMES = [
  'Janvier','Fevrier','Mars','Avril','Mai','Juin',
  'Juillet','Aout','Septembre','Octobre','Novembre','Decembre'
]

export const MONTH_SHORT = ['01','02','03','04','05','06','07','08','09','10','11','12']

export function formatNumber(n) {
  if (n == null) return '\u2014'
  return n.toLocaleString('fr-FR')
}

export function formatCurrency(n, unit = 'EUR') {
  if (n == null) return '\u2014'
  return n.toLocaleString('fr-FR') + ' ' + unit
}

export function formatPercent(n) {
  if (n == null) return '\u2014'
  return Math.round(n) + '%'
}
