const line = { fill: 'none', stroke: 'var(--accent)', strokeWidth: 1.2, strokeLinecap: 'round' }

const art = {
  hall: (
    <>
      {[30, 50, 70, 90].map((r) => (
        <path key={r} d={`M${100 - r} 110 A${r} ${r} 0 0 1 ${100 + r} 110`} {...line} opacity={0.35 + r / 150} />
      ))}
      <line x1="14" y1="110" x2="186" y2="110" {...line} />
    </>
  ),
  lab: (
    <>
      {Array.from({ length: 32 }, (_, i) => {
        const hot = [3, 10, 13, 21, 26].includes(i)
        return (
          <circle
            key={i}
            cx={24 + (i % 8) * 22}
            cy={26 + Math.floor(i / 8) * 22}
            r={hot ? 4.5 : 2}
            fill={hot ? 'var(--accent)' : 'none'}
            stroke="var(--accent)"
            strokeWidth="1.2"
            opacity={hot ? 1 : 0.6}
          />
        )
      })}
    </>
  ),
  sports: (
    <>
      <rect x="30" y="18" width="140" height="84" rx="4" {...line} />
      <line x1="100" y1="18" x2="100" y2="102" {...line} />
      <circle cx="100" cy="60" r="16" {...line} />
      <rect x="30" y="38" width="22" height="44" {...line} opacity=".6" />
      <rect x="148" y="38" width="22" height="44" {...line} opacity=".6" />
    </>
  ),
  library: (
    <>
      {Array.from({ length: 9 }, (_, i) => {
        const h = 40 + ((i * 37) % 5) * 9
        return <rect key={i} x={34 + i * 15} y={110 - h} width="10" height={h} rx="1.5" {...line} opacity={0.5 + (i % 3) * 0.18} />
      })}
    </>
  ),
  equipment: (
    <>
      <circle cx="78" cy="60" r="36" {...line} />
      <circle cx="122" cy="60" r="36" {...line} />
      <circle cx="100" cy="60" r="10" fill="var(--accent)" opacity=".85" />
    </>
  ),
  mentoring: (
    <>
      <ellipse cx="100" cy="60" rx="70" ry="24" {...line} transform="rotate(-18 100 60)" />
      <ellipse cx="100" cy="60" rx="70" ry="24" {...line} opacity=".5" transform="rotate(22 100 60)" />
      <circle cx="100" cy="60" r="8" fill="var(--accent)" />
      <circle cx="160" cy="44" r="4" fill="var(--accent)" opacity=".7" />
    </>
  ),
}

export default function CategoryArt({ category, className = '' }) {
  return (
    <svg viewBox="0 0 200 120" className={className} aria-hidden="true" preserveAspectRatio="xMidYMid slice">
      {art[category] || null}
    </svg>
  )
}