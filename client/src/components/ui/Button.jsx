const base =
  'inline-flex select-none items-center justify-center gap-2 rounded-full font-medium transition duration-300 ease-silk active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:pointer-events-none disabled:opacity-60'

const variants = {
  primary: 'bg-primary text-on-primary shadow-soft hover:brightness-110',
  accent: 'bg-accent text-[#1a1408] hover:brightness-105',
  outline: 'border border-line bg-surface text-ink hover:border-accent',
  ghost: 'text-ink hover:bg-surface-2',
}

const sizes = {
  sm: 'h-9 px-4 text-sm',
  md: 'h-11 px-6 text-sm',
  lg: 'h-13 px-8 text-base',
}

// eslint-disable-next-line react-refresh/only-export-components
export const buttonClasses = (variant = 'primary', size = 'md') =>
  `${base} ${variants[variant]} ${sizes[size]}`

export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  className = '',
  children,
  ...props
}) {
  return (
    <button
      className={`${buttonClasses(variant, size)} ${className}`}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading && (
        <svg className="size-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" opacity="0.25" />
          <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        </svg>
      )}
      {children}
    </button>
  )
}