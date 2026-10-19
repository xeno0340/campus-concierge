import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

// A reusable popup. Pass a stable onClose (wrap it in useCallback in the parent).
export default function Modal({ title, onClose, wide = false, children }) {
  const [shown, setShown] = useState(false)

  useEffect(() => {
    const raf = requestAnimationFrame(() => setShown(true))
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [onClose])

  // rendered into <body> so no parent transform can trap the fixed overlay
  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
      className={`fixed inset-0 z-[100] flex items-end justify-center bg-black/60 backdrop-blur-sm transition-opacity duration-200 sm:items-center sm:p-4 ${
        shown ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <div
        className={`flex max-h-[92svh] w-full flex-col overflow-hidden rounded-t-3xl border border-line bg-canvas shadow-2xl transition-all duration-300 sm:rounded-3xl ${
          wide ? 'sm:max-w-2xl' : 'sm:max-w-lg'
        } ${shown ? 'translate-y-0' : 'translate-y-6'}`}
      >
        <div className="flex items-center justify-between border-b border-line px-6 py-4">
          <h2 className="font-display text-2xl text-ink">{title}</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="grid size-9 place-items-center rounded-full text-muted transition-colors hover:bg-surface-2 hover:text-ink"
          >
            <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <path d="m6 6 12 12M18 6 6 18" />
            </svg>
          </button>
        </div>
        {/* data-lenis-prevent lets this box scroll normally inside the smooth-scroll page */}
        <div data-lenis-prevent className="overflow-y-auto overscroll-contain px-6 py-5">
          {children}
        </div>
      </div>
    </div>,
    document.body
  )
}