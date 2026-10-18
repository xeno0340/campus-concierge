import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import PageTransition from '../components/PageTransition.jsx'
import { Stagger, Item } from '../components/motion.jsx'
import { buttonClasses } from '../components/ui/Button.jsx'
import { api } from '../lib/api.js'

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
    <article className="group rounded-2xl border border-line bg-surface p-6 shadow-soft transition duration-500 ease-silk hover:-translate-y-1 hover:border-accent/60">
      <p className="text-xs tracking-[0.16em] text-accent-strong uppercase">{CATEGORY[service.category]}</p>
      <h3 className="mt-3 font-display text-2xl leading-tight text-ink">{service.name}</h3>
      <p className="mt-2 text-sm text-muted">{service.location}</p>
      <div className="mt-6 flex items-center justify-between border-t border-line pt-4 text-sm">
        <span className="font-medium text-ink">{formatPrice(service.price)}</span>
        <span className="text-muted">{service.slotMinutes} min slots</span>
      </div>
    </article>
  )
}

function SkeletonCard() {
  return <div className="h-48 animate-pulse rounded-2xl border border-line bg-surface-2" />
}

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
      <section className="mx-auto max-w-6xl px-4 pt-16 pb-12 sm:px-6 sm:pt-24">
        <Stagger>
          <Item>
            <p className="text-sm tracking-[0.2em] text-accent-strong uppercase">Smart Campus Services</p>
          </Item>
          <Item>
            <h1 className="mt-5 max-w-4xl font-display text-5xl leading-[1.02] tracking-tight text-ink sm:text-6xl lg:text-7xl">
              Every campus service, <em className="text-accent-strong">beautifully</em> booked.
            </h1>
          </Item>
          <Item>
            <p className="mt-6 max-w-xl text-lg text-muted">
              Reserve seminar halls, labs, courts and equipment in seconds. Pay securely, track every
              request, and never double-book again.
            </p>
          </Item>
          <Item className="mt-9 flex flex-wrap gap-3">
            <Link to="/register" className={buttonClasses('primary', 'lg')}>
              Get started
            </Link>
            <Link to="/login" className={buttonClasses('outline', 'lg')}>
              Sign in
            </Link>
          </Item>
        </Stagger>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-24 sm:px-6">
        <div className="mb-8 flex items-end justify-between">
          <h2 className="font-display text-3xl tracking-tight text-ink sm:text-4xl">Available now</h2>
        </div>

        {failed ? (
          <p className="rounded-xl border border-line bg-surface p-6 text-muted">
            Services could not be loaded. Make sure the backend is running.
          </p>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {services
              ? services.map((s) => <ServiceCard key={s._id} service={s} />)
              : Array.from({ length: 6 }, (_, i) => <SkeletonCard key={i} />)}
          </div>
        )}
      </section>
    </PageTransition>
  )
}