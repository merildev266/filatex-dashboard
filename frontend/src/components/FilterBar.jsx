import { useState, useEffect, useRef } from 'react'

const FILTER_OPTIONS = [
  { key: 'J-1', label: 'J-1', full: 'Jour (J-1)' },
  { key: 'M', label: 'M', full: 'Mois' },
  { key: 'Q', label: 'Q', full: 'Trimestre' },
  { key: 'A', label: 'A', full: 'Année' },
]

export default function FilterBar({ current, onChange }) {
  const [isOpen, setIsOpen] = useState(false)
  const ref = useRef(null)

  // Close on click outside
  useEffect(() => {
    if (!isOpen) return
    const close = (e) => { if (ref.current && !ref.current.contains(e.target)) setIsOpen(false) }
    document.addEventListener('pointerdown', close)
    return () => document.removeEventListener('pointerdown', close)
  }, [isOpen])

  const handleSelect = (key) => {
    onChange(key)
    setIsOpen(false)
  }

  return (
    <div ref={ref} className="filter-bar-wrap">
      {/* Desktop: inline buttons */}
      <div className="filter-bar-desktop">
        {FILTER_OPTIONS.map((opt) => (
          <button
            key={opt.key}
            onClick={() => onChange(opt.key)}
            className={`filter-btn ${current === opt.key ? 'active' : ''}`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Mobile: calendar icon + dropdown */}
      <button
        className="filter-fab"
        onClick={() => setIsOpen(!isOpen)}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{width:18,height:18}}>
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
          <line x1="16" y1="2" x2="16" y2="6"/>
          <line x1="8" y1="2" x2="8" y2="6"/>
          <line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
        <span className="filter-fab-label">{current}</span>
      </button>

      {/* Mobile dropdown */}
      <div className={`filter-dropdown ${isOpen ? 'open' : ''}`}>
        {FILTER_OPTIONS.map((opt) => (
          <button
            key={opt.key}
            onClick={() => handleSelect(opt.key)}
            className={`filter-dropdown-item ${current === opt.key ? 'active' : ''}`}
          >
            <span className="filter-dropdown-key">{opt.label}</span>
            <span className="filter-dropdown-full">{opt.full}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
