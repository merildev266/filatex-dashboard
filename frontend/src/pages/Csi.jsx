import SectionHeader from '../components/SectionHeader'

const ACCENT = '#0096c7'

export default function Csi() {
  return (
    <div style={{ background: 'var(--dark)', minHeight: '100dvh' }}>
      <SectionHeader name="CSI" color={ACCENT} />

      {/* Placeholder content */}
      <div className="flex flex-col items-center justify-center py-32 px-8 text-center">
        <div className="text-5xl font-bold mb-4" style={{ color: ACCENT }}>
          CSI
        </div>
        <p className="text-white/40 text-lg">
          Coming Soon
        </p>
      </div>
    </div>
  )
}
