import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import PageTransition from '../components/PageTransition.jsx'
import ServiceCard from '../components/ServiceCard.jsx'
import { api } from '../lib/api.js'
import { CATEGORY_LABELS } from '../lib/format.js'

const SkeletonCard = () => <div className="h-80 animate-pulse rounded-2xl border border-line bg-surface-2" />

export default function Services() {
  const [params, setParams] = useSearchParams()
  const q = params.get('q') || ''
  const category = params.get('category') || 'all'

  const [services, setServices] = useState(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    api
      .get('/services', { params: { limit: 50 } })
      .then((res) => setServices(res.data.services))
      .catch(() => setFailed(true))
  }, [])

  const setParam = (key, value) => {
    const next = new URLSearchParams(params)
    if (!value || value === 'all') next.delete(key)
    else next.set(key, value)
    setParams(next, { replace: true })
  }

  const filtered = useMemo(() => {
    if (!services) return null
    const term = q.trim().toLowerCase()
    return services.filter((s) => {
      if (category !== 'all' && s.category !== category) return false
      if (!term) return true
      return `${s.name} ${s.location} ${CATEGORY_LABELS[s.category] || ''}`.toLowerCase().includes(term)
    })
  }, [services, q, category])

  return (
    <PageTransition>
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
        <p className="text-xs tracking-[0.2em] text-accent-strong uppercase">Catalogue</p>
        <h1 className="mt-3 font-display text-5xl tracking-tight text-ink sm:text-7xl">Find your space</h1>
        <p className="mt-4 max-w-xl text-muted">
          Rooms, labs, courts and equipment across campus. Search, filter, then pick a time that works.
        </p>

        {/* search */}
        <div className="relative mt-10">
          <svg
            viewBox="0 0 24 24"
            className="pointer-events-none absolute top-1/2 left-5 size-5 -translate-y-1/2 text-muted"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
          <input
            type="search"
            value={q}
            onChange={(e) => setParam('q', e.target.value)}
            placeholder="Search by name or place"
            aria-label="Search services"
            className="w-full rounded-full border border-line bg-surface py-3.5 pr-5 pl-13 text-ink placeholder:text-muted focus:border-accent focus:outline-none"
          />
        </div>

        {/* category chips */}
        <div className="mt-5 flex flex-wrap gap-2">
          {['all', ...Object.keys(CATEGORY_LABELS)].map((key) => {
            const on = category === key
            return (
              <button
                key={key}
                onClick={() => setParam('category', key)}
                className={`rounded-full border px-4 py-2 text-sm whitespace-nowrap transition-colors ${
                  on
                    ? 'border-primary bg-primary text-on-primary'
                    : 'border-line text-muted hover:border-accent/60 hover:text-ink'
                }`}
              >
                {key === 'all' ? 'All' : CATEGORY_LABELS[key]}
              </button>
            )
          })}
        </div>

        {failed ? (
          <p className="mt-10 rounded-xl border border-line bg-surface p-6 text-muted">
            Services could not be loaded. Make sure the backend is running.
          </p>
        ) : (
          <>
            <p className="mt-8 text-sm text-muted">
              {filtered ? `${filtered.length} ${filtered.length === 1 ? 'service' : 'services'}` : 'Loading'}
            </p>

            {filtered && filtered.length === 0 ? (
              <div className="mt-6 rounded-2xl border border-dashed border-line p-12 text-center">
                <p className="font-display text-3xl text-ink">Nothing matches</p>
                <p className="mt-2 text-muted">Try a different word, or clear the filters.</p>
                <button
                  onClick={() => setParams({}, { replace: true })}
                  className="mt-6 rounded-full border border-line px-5 py-2 text-sm text-ink hover:border-accent/60"
                >
                  Clear filters
                </button>
              </div>
            ) : (
              <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {filtered
                  ? filtered.map((s, i) => (
                      <motion.div
                        key={s._id}
                        initial={{ opacity: 0, y: 24 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: Math.min(i, 8) * 0.05, ease: [0.22, 1, 0.36, 1] }}
                      >
                        <ServiceCard service={s} />
                      </motion.div>
                    ))
                  : Array.from({ length: 6 }, (_, i) => <SkeletonCard key={i} />)}
              </div>
            )}
          </>
        )}
      </div>
    </PageTransition>
  )
}