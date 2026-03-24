// Keys match existing JS convention: 'J-1', 'M', 'Q', 'A'
const FILTER_OPTIONS = [
  { key: 'J-1', label: 'J-1' },
  { key: 'M', label: 'M' },
  { key: 'Q', label: 'Q' },
  { key: 'A', label: 'A' },
]

export default function FilterBar({ current, onChange }) {
  return (
    <div className="flex gap-1 bg-[rgba(58,57,92,0.18)] rounded-lg p-1">
      {FILTER_OPTIONS.map((opt) => (
        <button
          key={opt.key}
          onClick={() => onChange(opt.key)}
          className={`px-3 py-1.5 rounded-md text-xs font-semibold uppercase tracking-wider
                     transition-colors cursor-pointer border-none
                     ${current === opt.key
                       ? 'bg-[rgba(58,57,92,0.5)] text-white'
                       : 'bg-transparent text-[var(--text-muted)] hover:text-white'
                     }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}
