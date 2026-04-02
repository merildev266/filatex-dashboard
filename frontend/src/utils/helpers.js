/* ── Shared utilities ── */

/** Convert hex color (#RRGGBB) to "r,g,b" string */
export function hexToRgb(hex) {
  const h = hex.replace('#', '')
  const r = parseInt(h.substring(0, 2), 16)
  const g = parseInt(h.substring(2, 4), 16)
  const b = parseInt(h.substring(4, 6), 16)
  return `${r},${g},${b}`
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
