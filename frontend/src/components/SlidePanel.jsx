import { useEffect } from 'react'

export default function SlidePanel({ isOpen, onClose, title, children }) {
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  return (
    <div
      className={`fixed inset-0 z-[800] transition-opacity duration-300
                  ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
    >
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div
        className={`absolute top-0 right-0 h-full bg-dark border-l border-[var(--border)]
                    w-full md:w-[600px] lg:w-[700px]
                    transition-transform duration-300 overflow-y-auto
                    ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="sticky top-0 z-10 bg-dark/90 backdrop-blur-sm
                       flex items-center gap-3 px-5 py-4 border-b border-[var(--border)]">
          <button
            onClick={onClose}
            className="text-[var(--text-muted)] hover:text-[var(--text)] text-lg
                       bg-transparent border-none cursor-pointer"
          >
            ←
          </button>
          <h2 className="text-sm font-bold uppercase tracking-wider">{title}</h2>
        </div>
        <div className="p-5">
          {children}
        </div>
      </div>
    </div>
  )
}
