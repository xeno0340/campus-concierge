import crypto from 'crypto'
import Razorpay from 'razorpay'
import Booking from '../models/Booking.js'
import { AppError } from '../utils/AppError.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { transition, expireStaleHolds } from '../lib/bookingEngine.js'

// Created on demand so the server still boots if keys are missing
function razorpay() {
  const { RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET } = process.env
  if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
    throw new AppError('Payments are not configured on the server', 500)
  }
  return new Razorpay({ key_id: RAZORPAY_KEY_ID, key_secret: RAZORPAY_KEY_SECRET })
}

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

  const order = await razorpay().orders.create({
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