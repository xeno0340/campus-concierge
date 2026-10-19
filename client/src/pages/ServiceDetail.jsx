import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import PageTransition from '../components/PageTransition.jsx'
import ServiceImage from '../components/ServiceImage.jsx'
import ServiceReviews from '../components/ServiceReviews.jsx'
import StarRating from '../components/StarRating.jsx'
import { buttonClasses } from '../components/ui/Button.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { api } from '../lib/api.js'
import {
  CATEGORY_LABELS,
  STATUS_LABELS,
  addDaysStr,
  campusToday,
  dayParts,
  formatPrice,
  formatTimeIST,
} from '../lib/format.js'
import { payForBooking } from '../lib/razorpay.js'

const OUTCOME_TEXT = {
  confirmed: 'You are all set. Show your booking code at the venue.',
  pending_approval: 'Sent to the service manager. You will hear back within 24 hours.',
  awaiting_payment: 'Your slot is held for 10 minutes. Pay now to confirm it.',
}

function HoldTimer({ until }) {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])

  const ms = new Date(until).getTime() - now
  const total = 10 * 60 * 1000
  const pct = Math.max(0, Math.min(100, (ms / total) * 100))
  const mm = String(Math.max(0, Math.floor(ms / 60000))).padStart(2, '0')
  const ss = String(Math.max(0, Math.floor((ms % 60000) / 1000))).padStart(2, '0')

  if (ms <= 0) {
    return (
      <p className="mx-auto mt-5 max-w-sm rounded-xl bg-danger/10 p-3 text-sm text-danger">
        This hold has expired. Pick the slot again to book it.
      </p>
    )
  }

  return (
    <div className="mx-auto mt-5 max-w-xs rounded-2xl bg-warning/10 p-4">
      <p className="text-xs tracking-[0.18em] text-warning uppercase">Slot held for you</p>
      <p className="mt-1 font-display text-5xl leading-none text-ink tabular-nums">
        {mm}:{ss}
      </p>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-warning/20">
        <div
          className="h-full rounded-full bg-warning transition-[width] duration-1000 ease-linear"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

export default function ServiceDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const location = useLocation()

  const [service, setService] = useState(null)
  const [notFound, setNotFound] = useState(false)

  const [date, setDate] = useState(campusToday)
  const [slots, setSlots] = useState(null)
  const [slotError, setSlotError] = useState('')
  const [selected, setSelected] = useState(null)
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState('')
  const [booked, setBooked] = useState(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const [paying, setPaying] = useState(false)
  const [payError, setPayError] = useState('')

  useEffect(() => {
    let off = false
    api
      .get(`/services/${id}`)
      .then((res) => {
        if (!off) setService(res.data.service ?? res.data)
      })
      .catch(() => {
        if (!off) setNotFound(true)
      })
    return () => {
      off = true
    }
  }, [id])

  useEffect(() => {
    let off = false
    api
      .get(`/services/${id}/availability`, { params: { date } })
      .then((res) => {
        if (off) return
        setSlots(res.data.slots)
        setSlotError('')
      })
      .catch((err) => {
        if (off) return
        setSlots([])
        setSlotError(err.userMessage || 'Could not load times for this day')
      })
    return () => {
      off = true
    }
  }, [id, date, refreshKey])

  const days = useMemo(() => {
    const n = Math.min(service?.advanceDays || 7, 14)
    const today = campusToday()
    return Array.from({ length: n }, (_, i) => addDaysStr(today, i))
  }, [service])

  const pickDate = (d) => {
    setDate(d)
    setSlots(null)
    setSlotError('')
    setSelected(null)
    setFormError('')
  }

  const allowed =
    user &&
    ['student', 'faculty'].includes(user.role) &&
    (!service?.bookableBy || service.bookableBy.includes(user.role))

  const book = async () => {
    if (!selected) return
    setSubmitting(true)
    setFormError('')
    try {
      const res = await api.post('/bookings', {
        serviceId: id,
        date,
        startTime: selected.time,
        notes: notes.trim() || undefined,
      })
      setBooked(res.data.booking)
      setRefreshKey((k) => k + 1)
    } catch (err) {
      setFormError(err.userMessage || 'Could not create the booking')
      setSelected(null)
      setRefreshKey((k) => k + 1)
    } finally {
      setSubmitting(false)
    }
  }

  const payNow = async () => {
    setPaying(true)
    setPayError('')
    try {
      const updated = await payForBooking(booked, user)
      setBooked((b) => ({ ...b, ...updated }))
      setRefreshKey((k) => k + 1)
    } catch (err) {
      if (err.message !== 'dismissed') setPayError(err.userMessage || err.message)
    } finally {
      setPaying(false)
    }
  }

  const resetBooking = () => {
    setBooked(null)
    setSelected(null)
    setNotes('')
    setPayError('')
  }

  if (notFound) {
    return (
      <PageTransition>
        <div className="mx-auto max-w-3xl px-4 py-24 text-center sm:px-6">
          <h1 className="font-display text-5xl text-ink">Service not found</h1>
          <p className="mt-3 text-muted">It may have been removed or is no longer active.</p>
          <Link to="/services" className={`${buttonClasses('primary', 'sm')} mt-8 inline-flex`}>
            Back to services
          </Link>
        </div>
      </PageTransition>
    )
  }

  const summaryDay = dayParts(date)

  return (
    <PageTransition>
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        <Link to="/services" className="text-sm text-muted transition-colors hover:text-ink">
          ← All services
        </Link>

        {/* banner: photo with the title on it */}
        <div className="group relative mt-5 h-64 overflow-hidden rounded-3xl border border-line bg-surface-2 sm:h-[26rem]">
          {service && (
            <ServiceImage
              category={service.category}
              name={service.name}
              image={service.images?.[0]}
              className="h-full w-full"
            />
          )}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-6 sm:p-10">
            {service ? (
              <>
                <span className="inline-block rounded-full bg-black/45 px-3 py-1 text-[11px] font-medium tracking-[0.16em] text-white/90 uppercase backdrop-blur-md">
                  {CATEGORY_LABELS[service.category]}
                </span>
                <h1 className="mt-3 font-display text-4xl leading-[1.05] tracking-tight text-white sm:text-6xl">
                  {service.name}
                </h1>
                <p className="mt-2 text-white/80">{service.location}</p>
                {service.ratingCount > 0 && (
                  <p className="mt-3 flex items-center gap-2 text-sm text-white/85">
                    <StarRating value={service.ratingAvg} size="size-4" />
                    {service.ratingAvg.toFixed(1)} ({service.ratingCount})
                  </p>
                )}
              </>
            ) : (
              <div className="space-y-3">
                <div className="h-5 w-24 animate-pulse rounded-full bg-white/20" />
                <div className="h-10 w-2/3 animate-pulse rounded bg-white/20" />
              </div>
            )}
          </div>
        </div>

        {/* quick facts */}
        {service && (
          <dl className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              ['Price', formatPrice(service.price)],
              ['Slot length', `${service.slotMinutes} min`],
              ['Capacity', service.capacity > 1 ? `Up to ${service.capacity} people` : 'One booking per slot'],
              ['Booking', service.requiresApproval ? 'Needs approval' : 'Instant'],
            ].map(([label, value]) => (
              <div key={label} className="rounded-2xl border border-line bg-surface p-4">
                <dt className="text-xs text-muted">{label}</dt>
                <dd className="mt-1 text-sm font-medium text-ink">{value}</dd>
              </div>
            ))}
          </dl>
        )}

        {/* about + booking */}
        <div className="mt-10 flex flex-col gap-8 lg:flex-row lg:items-start">
          <div className="min-w-0 lg:w-5/12">
            <h2 className="font-display text-3xl text-ink">About this service</h2>
            {service ? (
              <>
                <p className="mt-4 text-ink/80">
                  {service.description ||
                    `Pick a day and time on the right. ${
                      service.requiresApproval
                        ? 'A manager reviews each request before it is confirmed.'
                        : 'Your booking is confirmed straight away.'
                    }`}
                </p>
                <ul className="mt-6 space-y-3 text-sm">
                  {service.openTime && service.closeTime && (
                    <li className="flex justify-between border-b border-line pb-3">
                      <span className="text-muted">Open hours</span>
                      <span className="text-ink">
                        {service.openTime} to {service.closeTime}
                      </span>
                    </li>
                  )}
                  {service.bookableBy && (
                    <li className="flex justify-between border-b border-line pb-3">
                      <span className="text-muted">Bookable by</span>
                      <span className="text-ink capitalize">{service.bookableBy.join(', ')}</span>
                    </li>
                  )}
                  {service.advanceDays && (
                    <li className="flex justify-between border-b border-line pb-3">
                      <span className="text-muted">Book up to</span>
                      <span className="text-ink">{service.advanceDays} days ahead</span>
                    </li>
                  )}
                </ul>
              </>
            ) : (
              <div className="mt-4 space-y-3">
                <div className="h-4 w-full animate-pulse rounded bg-surface-2" />
                <div className="h-4 w-4/5 animate-pulse rounded bg-surface-2" />
              </div>
            )}
          </div>

          <aside className="h-fit min-w-0 rounded-3xl border border-line bg-surface p-6 shadow-soft lg:sticky lg:top-24 lg:w-7/12">
            {booked ? (
              <div className="py-4 text-center">
                <div className="mx-auto grid size-14 place-items-center rounded-full bg-success/15 text-success">
                  <svg
                    viewBox="0 0 24 24"
                    className="size-7"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="m5 12 5 5 9-10" />
                  </svg>
                </div>
                <p className="mt-5 text-xs tracking-[0.2em] text-accent-strong uppercase">
                  {STATUS_LABELS[booked.status] || booked.status}
                </p>
                <h2 className="mt-2 font-display text-4xl text-ink">{booked.bookingCode}</h2>
                <p className="mt-3 text-sm text-muted">
                  {summaryDay.weekday} {summaryDay.day} {summaryDay.month}, {formatTimeIST(booked.start)} to{' '}
                  {formatTimeIST(booked.end)}
                </p>
                <p className="mx-auto mt-4 max-w-sm text-sm text-ink/80">{OUTCOME_TEXT[booked.status]}</p>

                {booked.status === 'awaiting_payment' && booked.holdExpiresAt && (
                  <HoldTimer until={booked.holdExpiresAt} />
                )}

                {booked.status === 'awaiting_payment' && (
                  <div className="mt-4">
                    <button
                      onClick={payNow}
                      disabled={paying}
                      className={`${buttonClasses('primary', 'sm')} justify-center px-8 py-3 disabled:opacity-50`}
                    >
                      {paying ? 'Opening…' : `Pay ${formatPrice(booked.amount)}`}
                    </button>
                    {payError && <p className="mt-3 text-sm text-danger">{payError}</p>}
                  </div>
                )}

                <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                  <Link to="/bookings" className={`${buttonClasses('primary', 'sm')} whitespace-nowrap`}>
                    View my bookings
                  </Link>
                  <button onClick={resetBooking} className={`${buttonClasses('outline', 'sm')} whitespace-nowrap`}>
                    Book another slot
                  </button>
                </div>
              </div>
            ) : (
              <>
                <h2 className="font-display text-3xl text-ink">Choose a time</h2>

                <div className="-mx-1 mt-5 flex gap-2 overflow-x-auto px-1 pb-2">
                  {days.map((d) => {
                    const p = dayParts(d)
                    const on = d === date
                    return (
                      <button
                        key={d}
                        onClick={() => pickDate(d)}
                        className={`flex w-16 shrink-0 flex-col items-center rounded-2xl border py-3 transition-colors ${
                          on
                            ? 'border-primary bg-primary text-on-primary'
                            : 'border-line bg-surface-2 text-ink hover:border-accent/60'
                        }`}
                      >
                        <span className={`text-xs ${on ? 'text-accent' : 'text-muted'}`}>{p.weekday}</span>
                        <span className="mt-1 font-display text-2xl leading-none">{p.day}</span>
                        <span className={`mt-1 text-[11px] ${on ? 'text-on-primary/70' : 'text-muted'}`}>
                          {p.month}
                        </span>
                      </button>
                    )
                  })}
                </div>

                <div className="mt-5 min-h-32">
                  {slots === null ? (
                    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                      {Array.from({ length: 8 }, (_, i) => (
                        <div key={i} className="h-14 animate-pulse rounded-xl bg-surface-2" />
                      ))}
                    </div>
                  ) : slotError ? (
                    <p className="rounded-xl border border-line bg-surface-2 p-4 text-sm text-muted">{slotError}</p>
                  ) : slots.length === 0 ? (
                    <p className="text-sm text-muted">No slots on this day.</p>
                  ) : (
                    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                      {slots.map((s) => {
                        const on = selected?.start === s.start
                        return (
                          <button
                            key={s.start}
                            disabled={!s.available}
                            onClick={() => setSelected(s)}
                            className={`rounded-xl border px-2 py-2.5 text-center transition-colors ${
                              on
                                ? 'border-accent bg-accent/15 text-ink'
                                : s.available
                                  ? 'border-line bg-surface text-ink hover:border-accent/60'
                                  : 'cursor-not-allowed border-line bg-surface-2 text-muted/60'
                            }`}
                          >
                            <span className="block text-sm font-medium">{s.time}</span>
                            <span className="block text-[11px] text-muted">
                              {s.available
                                ? service?.capacity > 1
                                  ? `${s.remaining} left`
                                  : 'Open'
                                : s.remaining > 0
                                  ? 'Passed'
                                  : 'Full'}
                            </span>
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>

                {selected && (
                  <div className="mt-5">
                    <label htmlFor="notes" className="text-sm text-muted">
                      Note for the manager (optional)
                    </label>
                    <textarea
                      id="notes"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      maxLength={300}
                      rows={2}
                      className="mt-2 w-full resize-none rounded-xl border border-line bg-surface-2 p-3 text-sm text-ink focus:border-accent focus:outline-none"
                    />
                    <div className="mt-4 flex items-center justify-between rounded-xl bg-surface-2 p-4 text-sm">
                      <span className="text-muted">
                        {summaryDay.weekday} {summaryDay.day} {summaryDay.month}, {selected.time} to{' '}
                        {formatTimeIST(selected.end)}
                      </span>
                      <span className="font-medium text-ink">{formatPrice(service?.price ?? 0)}</span>
                    </div>
                  </div>
                )}

                {formError && (
                  <p
                    role="alert"
                    className="mt-4 rounded-xl border border-danger/40 bg-danger/10 p-3 text-sm text-danger"
                  >
                    {formError}
                  </p>
                )}

                <div className="mt-5">
                  {!user ? (
                    <Link
                      to="/login"
                      state={{ from: location.pathname }}
                      className={`${buttonClasses('primary', 'sm')} w-full justify-center py-3`}
                    >
                      Sign in to book
                    </Link>
                  ) : !allowed ? (
                    <p className="rounded-xl bg-surface-2 p-4 text-sm text-muted">
                      Your account type cannot book this service.
                    </p>
                  ) : (
                    <button
                      onClick={book}
                      disabled={!selected || submitting}
                      className={`${buttonClasses('primary', 'sm')} w-full justify-center py-3 disabled:cursor-not-allowed disabled:opacity-50`}
                    >
                      {submitting
                        ? 'Booking'
                        : service?.requiresApproval
                          ? 'Request booking'
                          : service?.price > 0
                            ? 'Hold slot and continue'
                            : 'Book now'}
                    </button>
                  )}
                </div>
              </>
            )}
          </aside>
        </div>

        <ServiceReviews serviceId={id} />
      </div>
    </PageTransition>
  )
}