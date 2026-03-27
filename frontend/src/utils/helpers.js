/* ── Shared utilities ── */

/** Classify ENR project phase */
export function getPhase(p) {
  const cc = p.cc || {}
  if (cc.avReel >= 100 || p.status === 'Termine') return 'Termine'
  if (cc.constPct > 0 || p.status === 'Construction') return 'Construction'
  if (cc.engPct > 0 || p.status === 'Developpement') return 'Developpement'
  return 'Planifie'
}

/** Convert hex color (#RRGGBB) to "r,g,b" string */
export function hexToRgb(hex) {
  const h = hex.replace('#', '')
  const r = parseInt(h.substring(0, 2), 16)
  const g = parseInt(h.substring(2, 4), 16)
  const b = parseInt(h.substring(4, 6), 16)
  return `${r},${g},${b}`
}

/** Return color for timing status */
export function getTimingColor(timing) {
  if (!timing) return 'rgba(255,255,255,0.3)'
  const t = timing.toLowerCase()
  if (t.includes('on time') || t === 'on_time') return '#00ab63'
  if (t.includes('delay') || t.includes('retard')) return '#E05C5C'
  return 'rgba(255,255,255,0.3)'
}

/** Format number as "$XM" */
export function fmtM(v) {
  if (v == null || isNaN(v)) return '—'
  return v >= 1 ? `$${v.toFixed(1)}M` : `$${(v * 1000).toFixed(0)}k`
}

/** Parse a dollar string like "3 764 713 $" or "804 k$" or "3.8 M$" into a number in M$ */
export function parseDollar(s) {
  if (!s || s === '—') return 0
  const cleaned = s.replace(/[^\d.,kKmM$-]/g, '').replace(',', '.')
  const num = parseFloat(cleaned.replace(/[kKmM$]/g, '')) || 0
  if (/M/i.test(s)) return num
  if (/k/i.test(s)) return num / 1000
  return num / 1_000_000
}
