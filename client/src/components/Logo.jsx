export default function Logo({ className = '' }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <svg viewBox="0 0 32 32" className="size-8" aria-hidden="true">
        <rect width="32" height="32" rx="10" fill="var(--primary)" />
        <circle cx="16" cy="16" r="9.5" fill="none" stroke="var(--accent)" strokeWidth="1.4" />
        <path
          d="M20.2 12.6A5.6 5.6 0 1 0 20.2 19.4"
          fill="none"
          stroke="var(--on-primary)"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
      <span className="font-display text-[22px] leading-none tracking-tight text-ink">
        Campus Concierge
      </span>
    </span>
  )
}