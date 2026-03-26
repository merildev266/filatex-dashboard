import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'

const FILTER_OPTIONS = [
  { key: 'J-1', label: 'J-1', full: 'Hier', icon: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
      <path d="M3 3v5h5"/>
      <path d="M12 7v5l4 2"/>
    </svg>
  )},
  { key: 'M', label: 'M', full: 'Mois', icon: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
      <text x="12" y="18" textAnchor="middle" fill="currentColor" stroke="none" fontSize="7" fontWeight="800">31</text>
    </svg>
  )},
  { key: 'Q', label: 'Q', full: 'Trim.', icon: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="14" width="4" height="8" rx="1" fill="currentColor" opacity="0.3"/>
      <rect x="10" y="9" width="4" height="13" rx="1" fill="currentColor" opacity="0.3"/>
      <rect x="16" y="4" width="4" height="18" rx="1" fill="currentColor" opacity="0.3"/>
      <rect x="4" y="14" width="4" height="8" rx="1"/>
      <rect x="10" y="9" width="4" height="13" rx="1"/>
      <rect x="16" y="4" width="4" height="18" rx="1"/>
    </svg>
  )},
  { key: 'A', label: 'A', full: 'Année', icon: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9"/>
      <circle cx="12" cy="12" r="1.5" fill="currentColor"/>
      <path d="M12 3v2"/><path d="M12 19v2"/>
      <path d="M3 12h2"/><path d="M19 12h2"/>
      <path d="M5.64 5.64l1.41 1.41"/><path d="M16.95 16.95l1.41 1.41"/>
      <path d="M5.64 18.36l1.41-1.41"/><path d="M16.95 7.05l1.41-1.41"/>
    </svg>
  )},
]

export default function FilterBar({ current, onChange }) {
  const [isOpen, setIsOpen] = useState(false)

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

  /* FAB + sidebar + backdrop ALL via portal to body — escapes header stacking context */
  const mobilePortal = createPortal(
    <>
      {/* FAB button — fixed in top-right, always visible on mobile */}
      <button
        className={`filter-time-fab ${isOpen ? 'open' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 3h14"/><path d="M5 21h14"/>
          <path d="M7 3v4.5a1 1 0 0 0 .4.8L12 12l-4.6 3.7a1 1 0 0 0-.4.8V21"/>
          <path d="M17 3v4.5a1 1 0 0 1-.4.8L12 12l4.6 3.7a1 1 0 0 1 .4.8V21"/>
          <circle cx="12" cy="12" r="0.5" fill="currentColor" stroke="none"/>
          <circle cx="11" cy="17.5" r="0.4" fill="currentColor" stroke="none" opacity="0.6"/>
          <circle cx="13" cy="18" r="0.4" fill="currentColor" stroke="none" opacity="0.6"/>
          <circle cx="12" cy="18.5" r="0.4" fill="currentColor" stroke="none" opacity="0.4"/>
        </svg>
      </button>

      {/* Backdrop */}
      {isOpen && <div className="mob-nav-backdrop open" onClick={() => setIsOpen(false)} />}

      {/* Sidebar */}
      {isOpen && (
        <div className="mob-nav-sidebar open">
          {FILTER_OPTIONS.map((opt, i) => {
            const active = current === opt.key
            return (
              <button
                key={opt.key}
                onClick={() => handleSelect(opt.key)}
                className={`mob-nav-item visible ${active ? 'active' : ''}`}
                style={{
                  '--delay': `${i * 35}ms`,
                  '--item-color': active ? 'var(--text)' : 'rgba(255,255,255,0.4)',
                  '--item-rgb': '0,171,99',
                }}
              >
                <div className="mob-nav-icon">{opt.icon}</div>
                <span className="mob-nav-label">{opt.full}</span>
              </button>
            )
          })}
        </div>
      )}
    </>,
    document.body
  )

  return (
    <>
      {/* ── Desktop: icon circles + labels ── */}
      <div className="filter-bar-desktop">
        {FILTER_OPTIONS.map((opt) => {
          const active = current === opt.key
          return (
            <button
              key={opt.key}
              onClick={() => onChange(opt.key)}
              className={`filter-item ${active ? 'active' : ''}`}
            >
              <div className="filter-icon-circle">{opt.icon}</div>
              <span className="filter-item-label">{opt.label}</span>
            </button>
          )
        })}
      </div>

      {/* Portal: FAB + sidebar + backdrop — all at body level */}
      {mobilePortal}
    </>
  )
}
