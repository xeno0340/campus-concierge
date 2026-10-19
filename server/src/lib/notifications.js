import User from '../models/User.js'
import Service from '../models/Service.js'
import { sendMailSafe } from './mailer.js'

const esc = (s = '') =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c])

const clientUrl = () => (process.env.CLIENT_URL || 'http://localhost:5173').replace(/\/+$/, '')
const rupees = (n) => (!n ? 'Free' : `₹${new Intl.NumberFormat('en-IN').format(n)}`)

const dateIST = (d) =>
  new Intl.DateTimeFormat('en-IN', { timeZone: 'Asia/Kolkata', weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(d))
const timeIST = (d) =>
  new Intl.DateTimeFormat('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date(d))
const dateTimeIST = (d) => `${dateIST(d)}, ${timeIST(d)}`

// ---- layout ----------------------------------------------------------------

function layout({ heading, intro, rows = [], notice, cta, footer }) {
  const rowsHtml = rows.length
    ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;border-top:1px solid #e8e2d8">${rows
        .map(
          ([k, v]) =>
            `<tr><td style="padding:10px 0;border-bottom:1px solid #e8e2d8;color:#6b6760;font-size:14px;width:38%">${esc(k)}</td><td style="padding:10px 0;border-bottom:1px solid #e8e2d8;color:#1a1a1a;font-size:14px;font-weight:600">${esc(v)}</td></tr>`
        )
        .join('')}</table>`
    : ''
  const noticeHtml = notice
    ? `<p style="margin:0 0 24px;padding:14px 16px;background:#f3efe6;border-radius:10px;color:#3d3a34;font-size:14px;line-height:1.5">${esc(notice)}</p>`
    : ''
  const ctaHtml = cta
    ? `<a href="${esc(cta.url)}" style="display:inline-block;background:#1b2a4a;color:#ffffff;text-decoration:none;padding:12px 26px;border-radius:999px;font-size:14px;font-weight:600">${esc(cta.label)}</a>`
    : ''

  return `<!doctype html><html><body style="margin:0;padding:0;background:#f7f4ee;font-family:Arial,Helvetica,sans-serif">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f7f4ee;padding:32px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:18px;padding:32px 28px">
<tr><td>
<p style="margin:0 0 20px;font-size:12px;letter-spacing:0.18em;text-transform:uppercase;color:#8a6d3b">Campus Concierge</p>
<h1 style="margin:0 0 12px;font-family:Georgia,serif;font-size:28px;line-height:1.2;color:#1a1a1a;font-weight:normal">${esc(heading)}</h1>
<p style="margin:0;color:#3d3a34;font-size:15px;line-height:1.6">${intro}</p>
${rowsHtml}${noticeHtml}${ctaHtml}
<p style="margin:28px 0 0;color:#9a958b;font-size:12px;line-height:1.5">${esc(footer || 'You are receiving this because of activity on your Campus Concierge account.')}</p>
</td></tr></table></td></tr></table></body></html>`
}

function bookingRows(b, service) {
  return [
    ['Service', service?.name || 'Service'],
    ...(service?.location ? [['Location', service.location]] : []),
    ['Date', dateIST(b.start)],
    ['Time', `${timeIST(b.start)} to ${timeIST(b.end)}`],
    ['Amount', rupees(b.amount)],
    ['Booking code', b.bookingCode],
  ]
}

// ---- one builder per event -------------------------------------------------
// Returns { subject, html, text }

export function buildEmail(event, { user, booking, service, reason }) {
  const first = esc((user?.name || 'there').split(' ')[0])
  const bookings = { label: 'View my bookings', url: `${clientUrl()}/bookings` }
  const rows = booking ? bookingRows(booking, service) : []
  const name = service?.name || 'your booking'
  let subject, heading, intro, notice, cta

  switch (event) {
    case 'welcome':
      subject = 'Welcome to Campus Concierge'
      heading = `Welcome, ${user.name.split(' ')[0]}`
      intro = `Hi ${first}, your account is ready. You can now browse campus halls, labs, courts and more, and book a slot in a few taps.`
      cta = { label: 'Browse services', url: `${clientUrl()}/services` }
      break
    case 'requested':
      subject = `Request received: ${name}`
      heading = 'Request received'
      intro = `Hi ${first}, we have sent your request for <b>${esc(name)}</b> to the service manager. Your slot is held for you while they review it.`
      notice = 'You will get another email as soon as the manager responds.'
      cta = bookings
      break
    case 'confirmed':
      subject = `Booking confirmed: ${name}`
      heading = 'Your booking is confirmed'
      intro = `Hi ${first}, you are all set for <b>${esc(name)}</b>.`
      notice = 'Show your QR check-in pass from My bookings when you arrive. Check-in opens 30 minutes before the slot starts.'
      cta = bookings
      break
    case 'approved_pay':
      subject = `Approved, please pay: ${name}`
      heading = 'Approved. Complete your payment'
      intro = `Hi ${first}, the manager approved your request for <b>${esc(name)}</b>.`
      notice = booking?.holdExpiresAt
        ? `Your slot is held until ${dateTimeIST(booking.holdExpiresAt)} (IST). Pay before then to confirm it.`
        : 'Pay soon to confirm your slot.'
      cta = { label: 'Pay now', url: `${clientUrl()}/bookings` }
      break
    case 'approved_confirmed':
      subject = `Approved and confirmed: ${name}`
      heading = 'Approved and confirmed'
      intro = `Hi ${first}, the manager approved your request for <b>${esc(name)}</b>, and it is free, so you are confirmed.`
      notice = 'Show your QR check-in pass from My bookings when you arrive.'
      cta = bookings
      break
    case 'paid':
      subject = `Payment received: ${name}`
      heading = 'Payment received'
      intro = `Hi ${first}, thank you. We received your payment of <b>${esc(rupees(booking.amount))}</b> and your booking is confirmed.`
      notice = 'Show your QR check-in pass from My bookings when you arrive.'
      cta = bookings
      break
    case 'rejected':
      subject = `Request not approved: ${name}`
      heading = 'Request not approved'
      intro = `Hi ${first}, unfortunately the manager could not approve your request for <b>${esc(name)}</b>.`
      notice = reason ? `Reason from the manager: ${reason}` : undefined
      cta = { label: 'Find another slot', url: `${clientUrl()}/services` }
      break
    case 'expired':
      subject = `Your hold expired: ${name}`
      heading = 'Your slot was released'
      intro = `Hi ${first}, your slot for <b>${esc(name)}</b> was released because it was not confirmed or paid for in time. No payment was taken.`
      cta = { label: 'Book again', url: `${clientUrl()}/services` }
      break
    case 'cancelled': {
      subject = `Booking cancelled: ${name}`
      heading = 'Booking cancelled'
      intro = `Hi ${first}, your booking for <b>${esc(name)}</b> has been cancelled and the slot released.`
      const pay = booking?.payment
      if (pay?.paymentId) {
        const amt = rupees(pay.refundAmount ?? pay.amount ?? booking.amount)
        if (pay.refundStatus === 'processed') notice = `Your refund of ${amt} has been sent to your original payment method.`
        else if (pay.refundStatus === 'failed') notice = `We could not send your refund of ${amt} yet. We will keep retrying automatically.`
        else notice = `A refund of ${amt} has been started. It usually reaches you in 5 to 7 working days.`
      } else if (booking?.amount > 0) {
        notice = 'No payment was taken for this booking, so there is nothing to refund.'
      }
      cta = bookings
      break
    }
    default:
      throw new Error(`Unknown email event: ${event}`)
  }

  const html = layout({ heading, intro, rows, notice, cta })
  const text = [heading, '', intro.replace(/<[^>]+>/g, ''), '', ...rows.map(([k, v]) => `${k}: ${v}`), '', notice || '', cta ? `${cta.label}: ${cta.url}` : '']
    .join('\n')
    .replace(/&amp;/g, '&')
  return { subject, html, text }
}

// ---- sending (never throws, never blocks the request) -----------------------

async function deliver(event, { user, booking, reason }) {
  try {
    if (!user?.email) return
    const service = booking ? await Service.findById(booking.service).select('name location') : null
    const mail = buildEmail(event, { user, booking, service, reason })
    await sendMailSafe({ to: user.email, ...mail })
  } catch (err) {
    console.error(`Notification "${event}" failed:`, err.message)
  }
}

export function notifyWelcome(user) {
  void deliver('welcome', { user })
}

// event: requested | confirmed | approved_pay | approved_confirmed | paid | rejected | expired | cancelled
export function notifyBooking(event, booking, reason) {
  void (async () => {
    try {
      const user = await User.findById(booking.user).select('name email')
      await deliver(event, { user, booking, reason })
    } catch (err) {
      console.error(`Notification "${event}" failed:`, err.message)
    }
  })()
}

// Called by the booking engine after every successful status change
export function notifyTransition(from, booking, note) {
  const to = booking.status
  if (from === 'pending_approval' && to === 'awaiting_payment') return notifyBooking('approved_pay', booking)
  if (from === 'pending_approval' && to === 'confirmed') return notifyBooking('approved_confirmed', booking)
  if (from === 'awaiting_payment' && to === 'confirmed') return notifyBooking('paid', booking)
  if (to === 'rejected') return notifyBooking('rejected', booking, note)
  if (to === 'expired') return notifyBooking('expired', booking)
  // cancelled is sent by cancelBooking, after the refund result is known
}