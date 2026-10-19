import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import PageTransition from '../components/PageTransition.jsx'
import { buttonClasses } from '../components/ui/Button.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { api } from '../lib/api.js'
import { STATUS_LABELS, dayParts, formatTimeIST } from '../lib/format.js'
import { payForBooking } from '../lib/razorpay.js'

const ACTIVE = ['pending_approval', 'awaiting_payment', 'confirmed', 'checked_in']
const CANCELLABLE = ['pending_approval', 'awaiting_payment', 'confirmed']

const TONE = {
  confirmed: 'bg-success/15 text-success',
  checked_in: 'bg-success/15 text-success',
  completed: 'bg-success/15 text-success',
  pending_approval: 'bg-warning/15 text-warning',
  awaiting_payment: 'bg-warning/15 text-warning',
  rejected: 'bg-danger/15 text-danger',
  cancelled: 'bg-surface-2 text-muted',
  expired: 'bg-surface-2 text-muted',
  no_show: 'bg-danger/15 text-danger',
}

const istDate = (iso) => new Date(new Date(iso).getTime() + 330 * 60000).toISOString().slice(0, 10)
const rupees = (n) => (n === 0 ? 'Free' : `₹${new Intl.NumberFormat('en-IN').format(n)}`)

function countdown(ms) {
  if (ms <= 0) return '0m'
  const h = Math.floor(ms / 3600000)
  const m = Math.floor((ms % 3600000) / 60000)
  const s = Math.floor((ms % 60000) / 1000)
  if (h > 0) return `${h}h ${m}m`
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export default function MyBookings() {
  const { user } = useAuth()
  const [bookings, setBookings] = useState(null)
  const [failed, setFailed] = useState(false)
  const [tab, setTab] = useState('upcoming')
  const [now, setNow] = useState(() => Date.now())
  const [confirmId, setConfirmId] = useState(null)
  const [busyId, setBusyId] = useState(null)
  const [errors, setErrors] = useState({})

  useEffect(() => {
    let off = false
    api
      .get('/bookings/mine', { params: { limit: 50 } })
      .then((res) => {
        if (!off) setBookings(res.data.bookings)
      })
      .catch(() => {
        if (!off) setFailed(true)
      })
    return () => {
      off = true
    }
  }, [])

  // ticks once a second so hold countdowns stay live
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])

  const cancel = async (b) => {
    setBusyId(b._id)
    setErrors((e) => ({ ...e, [b._id]: '' }))
    try {
      const res = await api.patch(`/bookings/${b._id}/cancel`, { reason: 'Cancelled by user' })
      setBookings((list) =>
        list.map((x) => (x._id === b._id ? { ...x, ...res.data.booking, service: x.service } : x))
      )
      setConfirmId(null)
    } catch (err) {
      setErrors((e) => ({ ...e, [b._id]: err.userMessage || 'Could not cancel this booking' }))
    } finally {
      setBusyId(null)
    }
  }

  const pay = async (b) => {
    setBusyId(b._id)
    setErrors((e) => ({ ...e, [b._id]: '' }))
    try {
      const updated = await payForBooking(b, user)
      setBookings((list) =>
        list.map((x) => (x._id === b._id ? { ...x, ...updated, service: x.service } : x))
      )
    } catch (err) {
      if (err.message !== 'dismissed') {
        setErrors((e) => ({ ...e, [b._id]: err.userMessage || err.message }))
      }
    } finally {
      setBusyId(null)
    }
  }

  const isUpcoming = (b) => ACTIVE.includes(b.status) && new Date(b.end).getTime() >= now
  const upcoming = bookings?.filter(isUpcoming) ?? []
  const past = bookings?.filter((b) => !isUpcoming(b)) ?? []
  const shown = tab === 'upcoming' ? upcoming : past

  return (
    <PageTransition>
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-16">
        <p className="text-xs tracking-[0.2em] text-accent-strong uppercase">Your account</p>
        <h1 className="mt-3 font-display text-5xl tracking-tight text-ink sm:text-6xl">My bookings</h1>

        <div className="mt-8 flex gap-2">
          {[
            ['upcoming', `Upcoming${bookings ? ` (${upcoming.length})` : ''}`],
            ['past', `Past${bookings ? ` (${past.length})` : ''}`],
          ].map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`rounded-full border px-5 py-2 text-sm whitespace-nowrap transition-colors ${
                tab === key
                  ? 'border-primary bg-primary text-on-primary'
                  : 'border-line text-muted hover:border-accent/60 hover:text-ink'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {failed ? (
          <p className="mt-8 rounded-xl border border-line bg-surface p-6 text-muted">
            Your bookings could not be loaded. Make sure you are signed in and the backend is running.
          </p>
        ) : bookings === null ? (
          <div className="mt-8 space-y-4">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-36 animate-pulse rounded-2xl border border-line bg-surface-2" />
            ))}
          </div>
        ) : shown.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-dashed border-line p-12 text-center">
            <p className="font-display text-3xl text-ink">
              {tab === 'upcoming' ? 'Nothing booked yet' : 'No past bookings'}
            </p>
            <p className="mt-2 text-muted">Find a room, lab or court and pick a time.</p>
            <Link to="/services" className={`${buttonClasses('primary', 'sm')} mt-6 inline-flex`}>
              Browse services
            </Link>
          </div>
        ) : (
          <ul className="mt-8 space-y-4">
            {shown.map((b) => {
              const p = dayParts(istDate(b.start))
              const holdMs = b.holdExpiresAt ? new Date(b.holdExpiresAt).getTime() - now : 0
              return (
                <li key={b._id} className="rounded-2xl border border-line bg-surface p-5 shadow-soft sm:p-6">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <Link
                        to={`/services/${b.service?._id}`}
                        className="font-display text-3xl leading-tight text-ink hover:text-accent-strong"
                      >
                        {b.service?.name || 'Service'}
                      </Link>
                      <p className="mt-1 text-sm text-muted">{b.service?.location}</p>
                    </div>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-medium whitespace-nowrap ${
                        TONE[b.status] || 'bg-surface-2 text-muted'
                      }`}
                    >
                      {STATUS_LABELS[b.status] || b.status}
                    </span>
                  </div>

                  <div className="mt-5 grid grid-cols-2 gap-4 border-t border-line pt-4 text-sm sm:grid-cols-4">
                    <div>
                      <p className="text-xs text-muted">Date</p>
                      <p className="mt-1 text-ink">
                        {p.weekday} {p.day} {p.month}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted">Time</p>
                      <p className="mt-1 text-ink">
                        {formatTimeIST(b.start)} to {formatTimeIST(b.end)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted">Amount</p>
                      <p className="mt-1 text-ink">{rupees(b.amount ?? 0)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted">Code</p>
                      <p className="mt-1 font-medium tracking-wide text-ink">{b.bookingCode}</p>
                    </div>
                  </div>

                  {b.status === 'awaiting_payment' && holdMs > 0 && (
                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-warning/10 p-3 text-sm text-warning">
                      <span>
                        Slot held for you. Pay within{' '}
                        <span className="font-semibold">{countdown(holdMs)}</span> to confirm.
                      </span>
                      <button
                        onClick={() => pay(b)}
                        disabled={busyId === b._id}
                        className="rounded-full bg-primary px-5 py-2 text-sm font-medium whitespace-nowrap text-on-primary disabled:opacity-50"
                      >
                        {busyId === b._id ? 'Opening…' : `Pay ${rupees(b.amount ?? 0)}`}
                      </button>
                    </div>
                  )}
                  {b.status === 'pending_approval' && (
                    <p className="mt-4 rounded-xl bg-surface-2 p-3 text-sm text-muted">
                      Waiting for the service manager to review your request.
                    </p>
                  )}

                  {errors[b._id] && (
                    <p
                      role="alert"
                      className="mt-4 rounded-xl border border-danger/40 bg-danger/10 p-3 text-sm text-danger"
                    >
                      {errors[b._id]}
                    </p>
                  )}

                  {CANCELLABLE.includes(b.status) && (
                    <div className="mt-4 flex items-center gap-3">
                      {confirmId === b._id ? (
                        <>
                          <span className="text-sm text-muted">Cancel this booking?</span>
                          <button
                            onClick={() => cancel(b)}
                            disabled={busyId === b._id}
                            className="rounded-full bg-danger px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                          >
                            {busyId === b._id ? 'Cancelling' : 'Yes, cancel'}
                          </button>
                          <button onClick={() => setConfirmId(null)} className="text-sm text-muted hover:text-ink">
                            Keep it
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => setConfirmId(b._id)}
                          disabled={busyId === b._id}
                          className="rounded-full border border-line px-4 py-2 text-sm text-ink transition-colors hover:border-danger/60 hover:text-danger disabled:opacity-50"
                        >
                          Cancel booking
                        </button>
                      )}
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </PageTransition>
  )
}