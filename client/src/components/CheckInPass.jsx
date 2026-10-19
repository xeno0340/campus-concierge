import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { QRCodeSVG } from 'qrcode.react'
import { dayParts, formatTimeIST } from '../lib/format.js'

const NAVY = '#1E2A4A'
const PAPER = '#FAF7F2'

const istDate = (iso) => new Date(new Date(iso).getTime() + 330 * 60000).toISOString().slice(0, 10)

// the brand mark that sits in the middle of the QR code
const LOGO =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="16" fill="${NAVY}"/><text x="32" y="45" font-family="Georgia,serif" font-size="40" text-anchor="middle" fill="${PAPER}">C</text></svg>`
  )

function Corner({ className }) {
  return <span aria-hidden="true" className={`absolute size-6 border-[#B08D57] ${className}`} />
}

export default function CheckInPass({ booking, onClose }) {
  const [shown, setShown] = useState(false)

  useEffect(() => {
    const raf = requestAnimationFrame(() => setShown(true))
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [onClose])

  const p = dayParts(istDate(booking.start))

  // rendered into <body> so no parent transform can trap the fixed overlay
  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Check-in pass"
      onClick={onClose}
      className={`fixed inset-0 z-[100] grid place-items-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm transition-opacity duration-200 ${
        shown ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`relative w-full max-w-sm overflow-hidden rounded-3xl bg-[#FAF7F2] shadow-2xl transition-all duration-300 ${
          shown ? 'translate-y-0 scale-100' : 'translate-y-3 scale-95'
        }`}
      >
        {/* header */}
        <div className="flex items-start justify-between bg-[#1E2A4A] px-6 py-5">
          <div>
            <p className="font-display text-2xl leading-none text-[#FAF7F2]">Campus Concierge</p>
            <p className="mt-2 text-[11px] tracking-[0.22em] text-[#C9A66B] uppercase">Check-in pass</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="grid size-9 place-items-center rounded-full text-[#FAF7F2]/80 transition-colors hover:bg-white/10 hover:text-white"
          >
            <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <path d="m6 6 12 12M18 6 6 18" />
            </svg>
          </button>
        </div>

        {/* details */}
        <div className="px-6 pt-6">
          <h2 className="font-display text-3xl leading-tight text-[#1F2430]">{booking.service?.name}</h2>
          {booking.service?.location && <p className="mt-1 text-sm text-[#6B7080]">{booking.service.location}</p>}

          <div className="mt-5 grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs text-[#6B7080]">Date</p>
              <p className="mt-1 font-medium text-[#1F2430]">
                {p.weekday} {p.day} {p.month}
              </p>
            </div>
            <div>
              <p className="text-xs text-[#6B7080]">Time</p>
              <p className="mt-1 font-medium text-[#1F2430]">
                {formatTimeIST(booking.start)} to {formatTimeIST(booking.end)}
              </p>
            </div>
          </div>
        </div>

        <div className="mx-6 mt-6 border-t border-dashed border-[#1F2430]/25" />

        {/* QR */}
        <div className="px-6 pt-6 pb-2 text-center">
          <div className="relative mx-auto w-fit p-5">
            <Corner className="top-0 left-0 rounded-tl-xl border-t-2 border-l-2" />
            <Corner className="top-0 right-0 rounded-tr-xl border-t-2 border-r-2" />
            <Corner className="bottom-0 left-0 rounded-bl-xl border-b-2 border-l-2" />
            <Corner className="right-0 bottom-0 rounded-br-xl border-r-2 border-b-2" />
            <QRCodeSVG
              value={booking.bookingCode}
              size={200}
              level="H"
              marginSize={0}
              fgColor={NAVY}
              bgColor={PAPER}
              imageSettings={{ src: LOGO, width: 44, height: 44, excavate: true }}
            />
          </div>
          <p className="mt-3 text-sm font-medium tracking-[0.3em] text-[#1F2430]">{booking.bookingCode}</p>
        </div>

        {/* footer */}
        <div className="px-6 pt-3 pb-6 text-center">
          <p className="text-xs text-[#6B7080]">
            Show this at the venue. Check-in opens 30 minutes before your slot starts.
          </p>
          <button
            onClick={onClose}
            className="mt-4 w-full rounded-full bg-[#1E2A4A] py-3 text-sm font-medium text-[#FAF7F2] transition-colors hover:bg-[#26355c]"
          >
            Done
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}