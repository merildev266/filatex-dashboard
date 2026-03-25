import { useState, useEffect, useRef } from 'react'

const FILTER_OPTIONS = [
  { key: 'J-1', label: 'J-1', full: 'Jour (J-1)', icon: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
    </svg>
  )},
  { key: 'M', label: 'M', full: 'Mois', icon: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  )},
  { key: 'Q', label: 'Q', full: 'Trimestre', icon: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="3" y1="10" x2="21" y2="10"/><line x1="9" y1="4" x2="9" y2="22"/><line x1="15" y1="4" x2="15" y2="22"/>
    </svg>
  )},
  { key: 'A', label: 'A', full: 'Année', icon: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
    </svg>
  )},
]

const ACCENT = '#00ab63'
const ACCENT_RGB = '0,171,99'

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

  // Close on scroll
  useEffect(() => {
    if (!isOpen) return
    const close = () => setIsOpen(false)
    window.addEventListener('scroll', close, { passive: true })
    return () => window.removeEventListener('scroll', close)
  }, [isOpen])

  const handleSelect = (key) => {
    onChange(key)
    setIsOpen(false)
  }

  return (
    <div ref={ref} className="filter-bar-wrap">
      {/* ── Desktop: icon circles like nav bar ── */}
      <div className="filter-bar-desktop">
        {FILTER_OPTIONS.map((opt) => {
          const active = current === opt.key
          return (
            <button
              key={opt.key}
              onClick={() => onChange(opt.key)}
              className={`filter-item ${active ? 'active' : ''}`}
            >
              <div className="filter-icon-circle">
                {opt.icon}
              </div>
              <span className="filter-item-label">{opt.label}</span>
            </button>
          )
        })}
      </div>

      {/* ── Mobile: FAB button + sidebar like nav ── */}
      {/* Backdrop */}
      <div
        className={`filter-mob-backdrop ${isOpen ? 'open' : ''}`}
        onClick={() => setIsOpen(false)}
      />

      {/* Sidebar */}
      <div className={`filter-mob-sidebar ${isOpen ? 'open' : ''}`}>
        {FILTER_OPTIONS.map((opt, i) => {
          const active = current === opt.key
          return (
            <button
              key={opt.key}
              onClick={() => handleSelect(opt.key)}
              className={`filter-mob-item ${isOpen ? 'visible' : ''} ${active ? 'active' : ''}`}
              style={{ '--delay': `${i * 40}ms` }}
            >
              <div className="filter-mob-icon">
                {opt.icon}
              </div>
              <span className="filter-mob-label">{opt.full}</span>
            </button>
          )
        })}
      </div>

      {/* FAB — calendar icon */}
      <button
        className={`filter-mob-fab ${isOpen ? 'open' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{width:22,height:22}}>
          <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
        <span className="filter-mob-fab-label">{current}</span>
      </button>
    </div>
  )
}
