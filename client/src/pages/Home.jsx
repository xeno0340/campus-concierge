import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import PageTransition from '../components/PageTransition.jsx'
import Hero from '../components/Hero.jsx'
import Marquee from '../components/Marquee.jsx'
import TiltCard from '../components/TiltCard.jsx'
import ServiceImage from '../components/ServiceImage.jsx'
import { api } from '../lib/api.js'
import PhoneSequence from '../components/PhoneSequence.jsx'

const CATEGORY = {
  hall: 'Halls',
  lab: 'Labs',
  sports: 'Sports',
  library: 'Library',
  equipment: 'Equipment',
  mentoring: 'Mentoring',
}

const formatPrice = (p) =>
  p === 0
    ? 'Free'
    : `${new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(p)} / slot`

function ServiceCard({ service }) {
  return (
    <TiltCard className="rounded-2xl">
      <article
        data-cursor="View"
        className="overflow-hidden rounded-2xl border border-line bg-surface shadow-soft transition-colors duration-500 hover:border-accent/60"
      >
        <div className="relative h-36 border-b border-line bg-surface-2">
          <ServiceImage category={service.category} name={service.name} image={service.images?.[0]} className="h-full w-full" />
          <span className="absolute top-3 left-3 rounded-full bg-black/45 px-3 py-1 text-[11px] font-medium tracking-[0.16em] text-white/90 uppercase backdrop-blur-md">
  {CATEGORY[service.category]}
</span>
        </div>
        <div className="p-6">
          <h3 className="font-display text-2xl leading-tight text-ink">{service.name}</h3>
          <p className="mt-2 text-sm text-muted">{service.location}</p>
          <div className="mt-6 flex items-center justify-between border-t border-line pt-4 text-sm">
            <span className="font-medium text-ink">{formatPrice(service.price)}</span>
            <span className="text-muted">{service.slotMinutes} min slots</span>
          </div>
        </div>
      </article>
    </TiltCard>
  )
}

const SkeletonCard = () => <div className="h-72 animate-pulse rounded-2xl border border-line bg-surface-2" />

export default function Home() {
  const [services, setServices] = useState(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    api
      .get('/services', { params: { limit: 6 } })
      .then((res) => setServices(res.data.services))
      .catch(() => setFailed(true))
  }, [])

  return (
    <PageTransition>
  <Hero />
  <Marquee />
  <PhoneSequence />

      <section id="services" className="mx-auto max-w-6xl scroll-mt-8 px-4 py-24 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="mb-12 flex items-end justify-between gap-6"
        >
          <div>
            <p className="text-xs tracking-[0.2em] text-accent-strong uppercase">01 — Services</p>
            <h2 className="mt-3 font-display text-5xl tracking-tight text-ink sm:text-7xl">Available now</h2>
          </div>
          <p className="hidden max-w-xs text-muted sm:block">
            Pick a service, choose a slot, and we hold it for you while you confirm.
          </p>
        </motion.div>

        {failed ? (
          <p className="rounded-xl border border-line bg-surface p-6 text-muted">
            Services could not be loaded. Make sure the backend is running.
          </p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {services
              ? services.map((s, i) => (
                  <motion.div
                    key={s._id}
                    initial={{ opacity: 0, y: 50 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-60px' }}
                    transition={{ duration: 0.8, delay: (i % 3) * 0.1, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <ServiceCard service={s} />
                  </motion.div>
                ))
              : Array.from({ length: 6 }, (_, i) => <SkeletonCard key={i} />)}
          </div>
        )}
      </section>
    </PageTransition>
  )
}