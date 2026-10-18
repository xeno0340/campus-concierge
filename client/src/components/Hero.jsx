import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import SplitText from './SplitText.jsx'
import Magnetic from './Magnetic.jsx'
import ErrorBoundary from './ErrorBoundary.jsx'
import { buttonClasses } from './ui/Button.jsx'

const HeroScene = lazy(() => import('./three/HeroScene.jsx'))

const fade = (delay) => ({
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.9, delay, ease: [0.22, 1, 0.36, 1] },
})

export default function Hero() {
  const ref = useRef(null)
  const [active, setActive] = useState(true)
  const reduce = useReducedMotion()
  const [low] = useState(
    () => window.matchMedia('(pointer: coarse)').matches || window.innerWidth < 768
  )

  // Pause the 3D scene whenever the hero is off-screen
  useEffect(() => {
    const io = new IntersectionObserver(([entry]) => setActive(entry.isIntersecting))
    io.observe(ref.current)
    return () => io.disconnect()
  }, [])

  const scrollToServices = () =>
    document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' })

  return (
    // "dark" re-skins this section with the dark palette in both themes
    <section
      ref={ref}
      className="dark relative isolate -mt-16 flex min-h-svh flex-col justify-between overflow-hidden rounded-b-[2.5rem] bg-canvas text-ink sm:rounded-b-[4rem]"
    >
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          backgroundImage:
            'radial-gradient(900px circle at 78% 40%, rgb(176 141 87 / 0.22), transparent 60%), radial-gradient(700px circle at 6% 100%, rgb(143 163 209 / 0.10), transparent 55%)',
        }}
      />

      <div className="absolute inset-0" aria-hidden="true">
        <ErrorBoundary>
          <Suspense fallback={null}>
            <HeroScene active={active} low={low} reduce={!!reduce} eventSource={ref} />
          </Suspense>
        </ErrorBoundary>
      </div>

      <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center px-4 pt-28 sm:px-6">
        <motion.p
          {...fade(0.1)}
          className="mb-8 inline-flex items-center gap-3 text-xs tracking-[0.22em] text-accent uppercase"
        >
          <span className="relative flex size-2">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-accent/60" />
            <span className="relative inline-flex size-2 rounded-full bg-accent" />
          </span>
          Campus booking, reimagined
        </motion.p>

        <SplitText
          text="Every campus service, *beautifully* booked."
          delay={0.25}
          className="max-w-5xl font-display text-[clamp(3.25rem,9.5vw,9.5rem)] leading-[0.92] tracking-[-0.02em] text-ink"
        />

        <motion.p {...fade(1.1)} className="mt-8 max-w-md text-lg text-muted">
          Rooms, labs, courts and equipment. Held fairly, paid securely, tracked live.
        </motion.p>

        <motion.div {...fade(1.25)} className="mt-10 flex flex-wrap gap-3">
          <Magnetic>
            <Link to="/register" data-cursor="Join" className={buttonClasses('accent', 'lg')}>
              Get started
            </Link>
          </Magnetic>
          <Magnetic>
            <button onClick={scrollToServices} data-cursor="Scroll" className={buttonClasses('outline', 'lg')}>
              Explore services
            </button>
          </Magnetic>
        </motion.div>
      </div>

      <motion.div
        {...fade(1.5)}
        className="relative z-10 mx-auto flex w-full max-w-6xl items-end justify-between px-4 pb-8 text-xs tracking-[0.18em] text-muted uppercase sm:px-6"
      >
        <span className="flex items-center gap-3">
          <span className="h-px w-10 bg-accent/70" />
          Scroll
        </span>
        <span className="hidden sm:block">Hyderabad · 17.38°N 78.48°E</span>
      </motion.div>
    </section>
  )
}