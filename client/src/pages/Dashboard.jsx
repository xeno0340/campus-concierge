import { useCallback, useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { api } from '../lib/api.js'
import StatsPanel from '../components/StatsPanel.jsx'

const TABS = [
  { key: 'pending_approval', label: 'Needs approval' },
  { key: 'awaiting_payment', label: 'Awaiting payment' },
  { key: 'confirmed', label: 'Confirmed' },
  { key: 'rejected', label: 'Rejected' },
]

const BADGE = {
  pending_approval: 'bg-warning/15 text-warning',
  awaiting_payment: 'bg-warning/15 text-warning',
  confirmed: 'bg-success/15 text-success',
  rejected: 'bg-danger/15 text-danger',
  cancelled: 'bg-surface-2 text-muted',
  expired: 'bg-surface-2 text-muted',
  completed: 'bg-success/15 text-success',
  checked_in: 'bg-success/15 text-success',
  no_show: 'bg-danger/15 text-danger',
}

const fmtDate = (d) =>
  new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  }).format(new Date(d))

const fmtTime = (d) =>
  new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(new Date(d))

function StatTile({ label, value, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-2xl border p-5 text-left transition ${
        active ? 'border-accent-strong bg-surface-2' : 'border-line bg-surface hover:bg-surface-2'
      }`}
    >
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-2 font-serif text-4xl text-ink">{value ?? '–'}</p>
    </button>
  )
}

function BookingRow({ booking, onChanged }) {
  const [busy, setBusy] = useState(false)
  const [rejecting, setRejecting] = useState(false)
  const [reason, setReason] = useState('')
  const [error, setError] = useState('')

  const act = async (path, body) => {
    setBusy(true)
    setError('')
    try {
      await api.patch(`/bookings/${booking._id}/${path}`, body)
      onChanged()
    } catch (err) {
      setError(err.userMessage || 'Something went wrong')
      setBusy(false)
    }
  }

  const canDecide = booking.status === 'pending_approval'

  return (
    <li className="rounded-2xl border border-line bg-surface p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-medium text-ink">{booking.service?.name}</p>
          <p className="mt-1 text-sm text-muted">
            {fmtDate(booking.start)} · {fmtTime(booking.start)} – {fmtTime(booking.end)}
          </p>
        </div>
        <span
          className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium ${
            BADGE[booking.status] || 'bg-surface-2 text-muted'
          }`}
        >
          {booking.status.replace(/_/g, ' ')}
        </span>
      </div>

      <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted">
        <span>
          <span className="text-ink">{booking.user?.name}</span>
          {booking.user?.department ? ` · ${booking.user.department}` : ''}
        </span>
        <span className="break-all">{booking.user?.email}</span>
        <span>{booking.amount > 0 ? `₹${booking.amount}` : 'Free'}</span>
      </div>

      {booking.notes && (
        <p className="mt-3 rounded-xl bg-surface-2 px-3 py-2 text-sm text-muted">
          “{booking.notes}”
        </p>
      )}

      {error && <p className="mt-3 text-sm text-danger">{error}</p>}

      {canDecide && !rejecting && (
        <div className="mt-4 flex gap-2">
          <button
            disabled={busy}
            onClick={() => act('approve')}
            className="rounded-full bg-primary px-5 py-2 text-sm font-medium text-on-primary disabled:opacity-50"
          >
            {busy ? 'Working…' : 'Approve'}
          </button>
          <button
            disabled={busy}
            onClick={() => setRejecting(true)}
            className="rounded-full border border-line px-5 py-2 text-sm text-ink hover:bg-surface-2 disabled:opacity-50"
          >
            Reject
          </button>
        </div>
      )}

      {canDecide && rejecting && (
        <div className="mt-4 space-y-2">
          <input
            autoFocus
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Reason (shown to the student)"
            className="w-full rounded-xl border border-line bg-canvas px-3 py-2 text-sm text-ink outline-none focus:border-accent-strong"
          />
          <div className="flex gap-2">
            <button
              disabled={busy || reason.trim().length < 3}
              onClick={() => act('reject', { reason: reason.trim() })}
              className="rounded-full bg-danger px-5 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {busy ? 'Rejecting…' : 'Confirm reject'}
            </button>
            <button
              disabled={busy}
              onClick={() => setRejecting(false)}
              className="rounded-full border border-line px-5 py-2 text-sm text-ink hover:bg-surface-2"
            >
              Back
            </button>
          </div>
        </div>
      )}
    </li>
  )
}

export default function Dashboard() {
  const { user } = useAuth()
  const [tab, setTab] = useState('pending_approval')
  const [counts, setCounts] = useState({})
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setError('')
    try {
      const [list, ...totals] = await Promise.all([
        api.get('/bookings/manage/list', { params: { status: tab, limit: 50 } }),
        ...TABS.map((t) =>
          api.get('/bookings/manage/list', { params: { status: t.key, limit: 1 } })
        ),
      ])
      setBookings(list.data.bookings)
      setCounts(Object.fromEntries(TABS.map((t, i) => [t.key, totals[i].data.pagination.total])))
    } catch (err) {
      setError(err.userMessage || 'Could not load bookings')
    } finally {
      setLoading(false)
    }
  }, [tab])

  useEffect(() => {
  if (user && ['manager', 'admin'].includes(user.role)) {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load()
  }
}, [load, user])

  if (!user || !['manager', 'admin'].includes(user.role)) {
    return <Navigate to="/services" replace />
  }

  return (
    <main className="mx-auto max-w-5xl px-4 pb-24 pt-28 sm:px-6">
      <p className="text-sm uppercase tracking-widest text-accent-strong">
        {user.role === 'admin' ? 'Admin' : 'Manager'} dashboard
      </p>
      <h1 className="mt-2 font-serif text-4xl text-ink sm:text-5xl">Welcome, {user.name?.split(' ')[0]}</h1>
      <p className="mt-3 max-w-xl text-muted">
        {user.role === 'admin'
          ? 'Every booking across campus.'
          : 'Bookings for the services you manage.'}{' '}
        Approve requests here so students can confirm or pay.
      </p>
            <Link
        to="/checkin"
        className="mt-6 inline-flex rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-on-primary"
      >
        Open check-in
      </Link>
      <StatsPanel />

      <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4">
        {TABS.map((t) => (
          <StatTile
            key={t.key}
            label={t.label}
            value={counts[t.key]}
            active={tab === t.key}
            onClick={() => {
              setLoading(true)
              setTab(t.key)
            }}
          />
        ))}
      </div>

      <h2 className="mt-10 font-serif text-2xl text-ink">
        {TABS.find((t) => t.key === tab)?.label}
      </h2>

      {error && <p className="mt-4 text-danger">{error}</p>}

      {loading ? (
        <div className="mt-4 space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-2xl bg-surface-2" />
          ))}
        </div>
      ) : bookings.length === 0 ? (
        <p className="mt-4 rounded-2xl border border-dashed border-line p-10 text-center text-muted">
          Nothing here right now.
        </p>
      ) : (
        <ul className="mt-4 space-y-3">
          {bookings.map((b) => (
            <BookingRow key={b._id} booking={b} onChanged={load} />
          ))}
        </ul>
      )}
    </main>
  )
}