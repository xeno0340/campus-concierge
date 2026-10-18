import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import ErrorBoundary from './ErrorBoundary.jsx'
import { stepFor } from './three/phoneConfig.js'

gsap.registerPlugin(ScrollTrigger)

const PhoneScene = lazy(() => import('./three/PhoneScene.jsx'))

const STEPS = [
  {
    eyebrow: 'The whole flow',
    title: 'One phone. Every campus service.',
    body: 'Keep scrolling. We will open it up and show how a booking really works.',
  },
  {
    eyebrow: '01 — Browse',
    title: 'Find the right space',
    body: 'Labs, courts, halls and equipment, all with live availability.',
  },
  {
    eyebrow: '02 — Pick a slot',
    title: 'Choose your time',
    body: 'A slot is held for you the moment you tap, so nobody can double-book you.',
  },
  {
    eyebrow: '03 — Pay',
    title: 'Confirm and pay',
    body: 'Secure checkout with a ten-minute hold while you complete payment.',
  },
  {
    eyebrow: '04 — Track',
    title: 'Show up and scan',
    body: 'A QR check-in and live status, from approval all the way to completed.',
  },
]

export default function PhoneSequence() {
  const sectionRef = useRef(null)
  const progress = useRef(0)
  const [step, setStep] = useState(0)
  const [active, setActive] = useState(false)

  useEffect(() => {
    const el = sectionRef.current
    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: el,
        start: 'top top',
        end: 'bottom bottom',
        onUpdate: (self) => {
          progress.current = self.progress
          const next = stepFor(self.progress)
          setStep((prev) => (prev === next ? prev : next))
        },
      })
      // only render WebGL while the section is on screen
      ScrollTrigger.create({
        trigger: el,
        start: 'top bottom',
        end: 'bottom top',
        onToggle: (self) => setActive(self.isActive),
      })
    }, el)
    return () => ctx.revert()
  }, [])

  return (
    <section ref={sectionRef} id="how" className="dark relative h-[500vh] bg-canvas text-ink">
      <div className="sticky top-0 h-dvh overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_50%_at_70%_50%,rgba(201,166,107,0.14),transparent_70%)]" />

        <div className="absolute inset-0">
          <ErrorBoundary>
            <Suspense fallback={null}>
              <PhoneScene progress={progress} active={active} />
            </Suspense>
          </ErrorBoundary>
        </div>

        {/* text */}
        <div className="pointer-events-none absolute inset-0 flex items-end pb-14 sm:items-center sm:pb-0">
          <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
            <div className="relative h-52 sm:h-80 sm:max-w-md">
              {STEPS.map((s, i) => (
                <div
                  key={s.title}
                  className={`absolute inset-0 flex flex-col justify-end transition-all duration-700 ease-out sm:justify-center ${
                    step === i ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'
                  }`}
                >
                  <p className="text-xs tracking-[0.2em] text-accent-strong uppercase">{s.eyebrow}</p>
                  <h2 className="mt-3 font-display text-4xl leading-[1.05] tracking-tight text-ink sm:text-6xl">
                    {s.title}
                  </h2>
                  <p className="mt-4 max-w-sm text-base text-muted">{s.body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* progress dots */}
        <div className="absolute top-1/2 right-4 flex -translate-y-1/2 flex-col gap-3 sm:right-8">
          {STEPS.map((s, i) => (
            <span
              key={s.title}
              className={`block w-1.5 rounded-full transition-all duration-500 ${
                step === i ? 'h-6 bg-accent' : 'h-1.5 bg-line'
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  )
}