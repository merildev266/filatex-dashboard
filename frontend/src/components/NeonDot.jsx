const STATUS_COLORS = {
  ok: '#00ab63',
  warn: '#f37056',
  ko: '#E05C5C',
}

export default function NeonDot({ status = 'ok', size = 8 }) {
  const color = STATUS_COLORS[status] || STATUS_COLORS.ok

  return (
    <span
      className="inline-block rounded-full"
      style={{
        width: size,
        height: size,
        backgroundColor: color,
        color: color,
        animation: 'neonPulse 2s ease-in-out infinite',
      }}
    />
  )
}
