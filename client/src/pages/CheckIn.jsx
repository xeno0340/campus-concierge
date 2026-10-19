import { useCallback, useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { Html5Qrcode } from 'html5-qrcode'
import PageTransition from '../components/PageTransition.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { api } from '../lib/api.js'
import { dayParts, formatTimeIST } from '../lib/format.js'

const istDate = (iso) => new Date(new Date(iso).getTime() + 330 * 60000).toISOString().slice(0, 10)

export default function CheckIn() {
  const { user } = useAuth()
  const isStaff = !!user && ['manager', 'admin'].includes(user.role)

  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState(null)
  const [log, setLog] = useState([])
  const [scanning, setScanning] = useState(false)
  const [camError, setCamError] = useState('')

  const submit = useCallback(async (raw) => {
    const value = String(raw || '').trim().toUpperCase()
    if (!value) return
    setBusy(true)
    setResult(null)
    try {
      const res = await api.patch('/bookings/check-in', { code: value })
      setResult({ ok: true, booking: res.data.booking })
      setLog((l) => [res.data.booking, ...l].slice(0, 8))
      setCode('')
    } catch (err) {
      setResult({ ok: false, code: value, message: err.userMessage || 'Could not check in' })
    } finally {
      setBusy(false)
    }
  }, [])

  // camera scanner: runs only while "scanning" is on
  useEffect(() => {
    if (!scanning) return
    const scanner = new Html5Qrcode('qr-reader')
    let started = false
    let cancelled = false
    const stop = () => scanner.stop().then(() => scanner.clear()).catch(() => {})

    scanner
      .start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 220, height: 220 } },
        (text) => {
          setScanning(false) // stops the camera via cleanup below
          submit(text)
        },
        () => {}
      )
      .then(() => {
        started = true
        if (cancelled) stop()
      })
      .catch(() => {
        setCamError('Could not open the camera. Allow camera access, or type the code instead.')
        setScanning(false)
      })

    return () => {
      cancelled = true
      if (started) stop()
    }
  }, [scanning, submit])

  if (!isStaff) return <Navigate to="/services" replace />

  const onSubmit = (e) => {
    e.preventDefault()
    submit(code)
  }

  return (
    <PageTransition>
      <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 sm:py-16">
        <p className="text-xs tracking-[0.2em] text-accent-strong uppercase">At the venue</p>
        <h1 className="mt-3 font-display text-5xl tracking-tight text-ink sm:text-6xl">Check-in</h1>
        <p className="mt-3 text-muted">
          Scan the student’s QR code or type the booking code. Check-in opens 30 minutes before the slot starts.
        </p>

        <form onSubmit={onSubmit} className="mt-8 flex flex-col gap-3 sm:flex-row">
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="CC-XXXXXXXX"
            autoCapitalize="characters"
            autoComplete="off"
            className="min-w-0 flex-1 rounded-full border border-line bg-surface px-5 py-3 font-medium tracking-wider text-ink uppercase outline-none focus:border-accent-strong"
          />
          <button
            type="submit"
            disabled={busy || !code.trim()}
            className="rounded-full bg-primary px-7 py-3 text-sm font-medium whitespace-nowrap text-on-primary disabled:opacity-50"
          >
            {busy ? 'Checking…' : 'Check in'}
          </button>
        </form>

        <div className="mt-4">
          <button
            onClick={() => {
              setCamError('')
              setScanning((s) => !s)
            }}
            className="rounded-full border border-line px-5 py-2 text-sm text-ink transition-colors hover:border-accent/60"
          >
            {scanning ? 'Stop camera' : 'Scan with camera'}
          </button>
          {camError && <p className="mt-3 text-sm text-danger">{camError}</p>}
        </div>

        {scanning && (
          <div className="mt-4 overflow-hidden rounded-2xl border border-line bg-black">
            <div id="qr-reader" className="w-full" />
          </div>
        )}

        {result?.ok && (
          <div className="mt-8 rounded-2xl border border-success/40 bg-success/10 p-5">
            <p className="text-xs tracking-[0.2em] text-success uppercase">Checked in</p>
            <p className="mt-2 font-display text-3xl text-ink">{result.booking.user?.name}</p>
            <p className="mt-1 text-sm text-muted">
              {result.booking.user?.department ? `${result.booking.user.department} · ` : ''}
              {result.booking.user?.email}
            </p>
            <p className="mt-3 text-ink">
              {result.booking.service?.name} ·{' '}
              {(() => {
                const p = dayParts(istDate(result.booking.start))
                return `${p.weekday} ${p.day} ${p.month}`
              })()}
              , {formatTimeIST(result.booking.start)} to {formatTimeIST(result.booking.end)}
            </p>
            <p className="mt-1 text-sm text-muted">{result.booking.bookingCode}</p>
          </div>
        )}

        {result && !result.ok && (
          <div role="alert" className="mt-8 rounded-2xl border border-danger/40 bg-danger/10 p-5">
            <p className="text-xs tracking-[0.2em] text-danger uppercase">Not checked in</p>
            <p className="mt-2 text-ink">{result.message}</p>
            <p className="mt-1 text-sm text-muted">{result.code}</p>
          </div>
        )}

        {log.length > 0 && (
          <section className="mt-10">
            <h2 className="font-display text-2xl text-ink">This session</h2>
            <ul className="mt-3 divide-y divide-line rounded-2xl border border-line bg-surface">
              {log.map((b) => (
                <li key={b._id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm">
                  <span className="text-ink">{b.user?.name}</span>
                  <span className="text-muted">
                    {b.service?.name} · {b.bookingCode}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </PageTransition>
  )
}