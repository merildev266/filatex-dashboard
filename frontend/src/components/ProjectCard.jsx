import StatusBadge from './StatusBadge'

export default function ProjectCard({ name, status, progress, phase, timingVar, onClick }) {
  const barColor = timingVar === 'delay' ? '#E05C5C' : '#00ab63'

  return (
    <div
      onClick={onClick}
      className="glass-card p-4 cursor-pointer hover:-translate-y-1 transition-transform"
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <h3 className="text-sm font-semibold leading-tight">{name}</h3>
        <StatusBadge status={status} />
      </div>
      {progress != null && (
        <div className="mb-2">
          <div className="h-1.5 bg-[rgba(255,255,255,0.08)] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${Math.min(progress, 100)}%`, backgroundColor: barColor }}
            />
          </div>
          <div className="text-[9px] text-[var(--text-muted)] mt-1 text-right">
            {Math.round(progress)}%
          </div>
        </div>
      )}
      {phase && (
        <div className="text-[10px] text-[var(--text-dim)]">
          {phase}
        </div>
      )}
    </div>
  )
}
