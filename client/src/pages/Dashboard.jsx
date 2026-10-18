import { useEffect, useState } from 'react'
import PageTransition from '../components/PageTransition.jsx'
import StatusBadge from '../components/StatusBadge.jsx'
import { Stagger, Item } from '../components/motion.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { api } from '../lib/api.js'

const formatWhen = (d) =>
  new Date(d).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Kolkata' })

export default function Dashboard() {
  const { user } = useAuth()
  const canBook = user.role === 'student' || user.role === 'faculty'
  const [bookings, setBookings] = useState(null)

  useEffect(() => {
    if (!canBook) return
    api
      .get('/bookings/mine', { params: { limit: 5 } })
      .then((res) => setBookings(res.data.bookings))
      .catch(() => setBookings([]))
  }, [canBook])

  return (
    <PageTransition>
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        <Stagger>
          <Item>
            <p className="text-sm tracking-[0.2em] text-accent-strong uppercase">{user.role}</p>
            <h1 className="mt-3 font-display text-4xl tracking-tight text-ink sm:text-5xl">
              Hello, {user.name.split(' ')[0]}.
            </h1>
          </Item>

          <Item className="mt-10">
            <div className="rounded-2xl border border-line bg-surface p-6 shadow-soft sm:p-8">
              <h2 className="font-display text-2xl text-ink">
                {canBook ? 'Your recent bookings' : 'Your workspace'}
              </h2>

              {!canBook && (
                <p className="mt-3 text-muted">
                  Your {user.role} tools are coming together in the next steps.
                </p>
              )}

              {canBook && bookings === null && (
                <div className="mt-6 space-y-3">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="h-14 animate-pulse rounded-xl bg-surface-2" />
                  ))}
                </div>
              )}

              {canBook && bookings?.length === 0 && (
                <p className="mt-3 text-muted">No bookings yet. Your first one will appear here.</p>
              )}

              {canBook && bookings?.length > 0 && (
                <ul className="mt-6 divide-y divide-line">
                  {bookings.map((b) => (
                    <li key={b._id} className="flex flex-wrap items-center justify-between gap-3 py-4">
                      <div>
                        <p className="font-medium text-ink">{b.service?.name}</p>
                        <p className="text-sm text-muted">{formatWhen(b.start)}</p>
                      </div>
                      <StatusBadge status={b.status} />
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </Item>
        </Stagger>
      </div>
    </PageTransition>
  )
}