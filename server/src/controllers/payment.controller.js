import crypto from 'crypto'
import Booking from '../models/Booking.js'
import { AppError } from '../utils/AppError.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { transition, expireStaleHolds } from '../lib/bookingEngine.js'
import { getRazorpay } from '../lib/gateway.js'
import { refundBooking } from '../lib/refunds.js'

async function loadOwnBooking(bookingId, userId) {
  if (typeof bookingId !== 'string') throw new AppError('bookingId is required', 400)
  const booking = await Booking.findById(bookingId)
  if (!booking) throw new AppError('Booking not found', 404)
  if (String(booking.user) !== String(userId)) {
    throw new AppError('You can only pay for your own bookings', 403)
  }
  return booking
}

// POST /api/payments/order   { bookingId }
export const createOrder = asyncHandler(async (req, res) => {
  await expireStaleHolds()
  const booking = await loadOwnBooking(req.body.bookingId, req.user.id)

  if (booking.status !== 'awaiting_payment') {
    throw new AppError('This booking is not waiting for payment', 400)
  }
  if (!(booking.amount > 0)) throw new AppError('This booking is free', 400)
  if (booking.holdExpiresAt && booking.holdExpiresAt.getTime() < Date.now()) {
    throw new AppError('The hold on this slot has expired', 400)
  }

  const order = await getRazorpay().orders.create({
    amount: Math.round(booking.amount * 100), // Razorpay works in paise
    currency: 'INR',
    receipt: booking.bookingCode,
    notes: { bookingId: String(booking._id) },
  })

  await Booking.updateOne(
    { _id: booking._id },
    { $set: { 'payment.orderId': order.id, 'payment.amount': booking.amount } }
  )

  res.json({
    success: true,
    orderId: order.id,
    amount: order.amount,
    currency: order.currency,
    keyId: process.env.RAZORPAY_KEY_ID,
    bookingCode: booking.bookingCode,
  })
})

// POST /api/payments/verify
export const verifyPayment = asyncHandler(async (req, res) => {
  const { bookingId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body
  if (![razorpay_order_id, razorpay_payment_id, razorpay_signature].every((v) => typeof v === 'string')) {
    throw new AppError('Missing payment details', 400)
  }

  const booking = await loadOwnBooking(bookingId, req.user.id)

  // Already processed (e.g. the browser retried): just return it
  if (booking.status === 'confirmed' && booking.payment?.paymentId === razorpay_payment_id) {
    return res.json({ success: true, booking })
  }

  if (booking.payment?.orderId !== razorpay_order_id) {
    throw new AppError('This payment does not match the booking', 400)
  }

  // Razorpay signs "orderId|paymentId" with your secret. Recompute and compare.
  const expected = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest('hex')

  const a = Buffer.from(expected)
  const b = Buffer.from(razorpay_signature)
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    throw new AppError('Payment signature check failed', 400)
  }

  const updated = await transition(booking, 'confirmed', {
    by: req.user._id,
    note: 'Payment received',
    set: {
      confirmedAt: new Date(),
      'payment.paymentId': razorpay_payment_id,
      'payment.paidAt': new Date(),
    },
  })

  res.json({ success: true, booking: updated })
})

// ---------------------------------------------------------------------------
// Razorpay webhook: POST /api/payments/webhook
// Razorpay calls this itself, so it is not logged-in and it needs the RAW body
// (mounted with express.raw in server.js) to check the signature.
// ---------------------------------------------------------------------------

function validSignature(rawBody, signature, secret) {
  const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex')
  const a = Buffer.from(expected)
  const b = Buffer.from(signature)
  return a.length === b.length && crypto.timingSafeEqual(a, b)
}

async function onPaymentCaptured(p) {
  const booking = await Booking.findOne({ 'payment.orderId': p.order_id })
  if (!booking) return // not one of ours

  // Ignore a payment whose amount does not match what we asked for
  if (p.currency !== 'INR' || p.amount !== Math.round((booking.payment.amount ?? booking.amount) * 100)) {
    console.error(`Webhook: amount mismatch on ${booking.bookingCode}`)
    return
  }

  // Already handled (the browser verify call got there first)
  if (booking.payment.paymentId === p.id) return

  const paidFields = { 'payment.paymentId': p.id, 'payment.paidAt': new Date() }

  if (booking.status === 'awaiting_payment') {
    // The customer paid but the browser never reported back (tab closed, network drop)
    await transition(booking, 'confirmed', {
      note: 'Payment received (webhook)',
      set: { confirmedAt: new Date(), ...paidFields },
    })
    return
  }

  if (!booking.payment.paymentId) {
    // Paid after the booking was cancelled or expired: the seat is gone, so give the money back
    const fresh = await Booking.findByIdAndUpdate(booking._id, { $set: paidFields }, { new: true })
    await refundBooking(fresh, { reason: 'Payment arrived after the booking ended' })
  }
}

async function onRefundUpdate(r, status) {
  const booking = await Booking.findOne({ 'payment.paymentId': r.payment_id })
  if (!booking) return
  const set = { 'payment.refundId': r.id, 'payment.refundStatus': status }
  if (status === 'processed') set['payment.refundedAt'] = new Date()
  if (status === 'failed') set['payment.refundError'] = 'The bank could not complete the refund'
  await Booking.updateOne({ _id: booking._id }, { $set: set })
}

export async function razorpayWebhook(req, res) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET
  if (!secret) return res.status(503).json({ ok: false, message: 'Webhook is not configured' })

  const signature = req.get('x-razorpay-signature')
  if (!Buffer.isBuffer(req.body) || !signature || !validSignature(req.body, signature, secret)) {
    return res.status(400).json({ ok: false, message: 'Invalid signature' })
  }

  try {
    const event = JSON.parse(req.body.toString('utf8'))
    const payload = event.payload || {}
    if (event.event === 'payment.captured') await onPaymentCaptured(payload.payment.entity)
    else if (event.event === 'refund.processed') await onRefundUpdate(payload.refund.entity, 'processed')
    else if (event.event === 'refund.failed') await onRefundUpdate(payload.refund.entity, 'failed')
    res.json({ ok: true })
  } catch (err) {
    console.error('Webhook handling failed:', err.message)
    res.status(500).json({ ok: false }) // a 5xx makes Razorpay retry later
  }
}