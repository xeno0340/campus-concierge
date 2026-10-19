import { useState } from 'react'

const STAR = 'M12 2.5l2.9 6.1 6.6.9-4.8 4.6 1.2 6.6L12 17.5l-5.9 3.2 1.2-6.6L2.5 9.5l6.6-.9L12 2.5z'

// Read-only stars (with a fractional fill) or, when onChange is given, a clickable picker.
export default function StarRating({ value = 0, onChange, size = 'size-5', label }) {
  const [hover, setHover] = useState(0)
  const interactive = typeof onChange === 'function'
  const shown = interactive && hover ? hover : value

  return (
    <span
      className="inline-flex items-center gap-0.5"
      role={interactive ? 'radiogroup' : 'img'}
      aria-label={label || `${Number(value).toFixed(1)} out of 5 stars`}
    >
      {[1, 2, 3, 4, 5].map((n) => {
        const fill = Math.max(0, Math.min(1, shown - (n - 1))) // 0 to 1 for partial stars
        const star = (
          <span className={`relative inline-block ${size}`}>
            <svg viewBox="0 0 24 24" className={`absolute inset-0 ${size} text-line`} fill="currentColor" aria-hidden="true">
              <path d={STAR} />
            </svg>
            <span className="absolute inset-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
              <svg viewBox="0 0 24 24" className={`${size} max-w-none text-accent-strong`} fill="currentColor" aria-hidden="true">
                <path d={STAR} />
              </svg>
            </span>
          </span>
        )
        return interactive ? (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={value === n}
            aria-label={`${n} star${n > 1 ? 's' : ''}`}
            onClick={() => onChange(n)}
            onMouseEnter={() => setHover(n)}
            onMouseLeave={() => setHover(0)}
            onFocus={() => setHover(n)}
            onBlur={() => setHover(0)}
            className="rounded p-0.5 transition-transform hover:scale-110"
          >
            {star}
          </button>
        ) : (
          <span key={n}>{star}</span>
        )
      })}
    </span>
  )
}