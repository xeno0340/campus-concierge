const WORDS = ['Seminar Halls', 'Computer Labs', 'Sports Courts', 'Library Rooms', 'Equipment', 'Mentoring']

export default function Marquee() {
  const row = WORDS.map((w, i) => (
    <span key={w} className="flex items-center gap-10 pr-10">
      <span className={i % 2 ? '[-webkit-text-stroke:1.2px_var(--ink)] text-transparent' : ''}>{w}</span>
      <span className="text-accent">✦</span>
    </span>
  ))

  return (
    <div className="overflow-hidden border-b border-line py-7" aria-hidden="true">
      <div className="flex w-max animate-marquee font-display text-5xl whitespace-nowrap text-ink sm:text-7xl hover:[animation-play-state:paused]">
        <div className="flex">{row}</div>
        <div className="flex">{row}</div>
      </div>
    </div>
  )
}