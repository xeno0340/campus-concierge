import Booking from '../models/Booking.js'
import { getRazorpay } from './gateway.js'

const MAX_ATTEMPTS = 5
const RETRY_AFTER_MS = 5 * 60 * 1000

const describe = (err) => err?.error?.description || err?.message || 'Refund request failed'

// Refunds the full amount of a paid booking. Never throws: a failed refund is
// recorded on the booking and retried later, so a cancel never gets stuck.
export async function refundBooking(booking, { reason = 'Booking cancelled' } = {}) {
  const pay = booking.payment
  if (!pay?.paymentId || !pay.paidAt) return booking // nothing was paid

  const amount = pay.amount ?? booking.amount

  // Claim the refund atomically so two requests can never refund the same payment twice
  const claimed = await Booking.findOneAndUpdate(
    {
      _id: booking._id,
      'payment.paymentId': pay.paymentId,
      'payment.refundStatus': { $nin: ['pending', 'processed'] },
      $or: [
        { 'payment.refundAttempts': { $exists: false } },
        { 'payment.refundAttempts': { $lt: MAX_ATTEMPTS } },
      ],
    },
    {
      $set: { 'payment.refundStatus': 'pending', 'payment.refundAmount': amount },
      $inc: { 'payment.refundAttempts': 1 },
    },
    { new: true }
  )
  if (!claimed) return (await Booking.findById(booking._id)) || booking

  try {
    const refund = await getRazorpay().payments.refund(pay.paymentId, {
      amount: Math.round(amount * 100), // paise
      speed: 'normal',
      notes: { bookingId: String(booking._id), reason: String(reason).slice(0, 200) },
    })
    const done = refund.status === 'processed'
    return await Booking.findByIdAndUpdate(
      booking._id,
      {
        $set: {
          'payment.refundId': refund.id,
          'payment.refundStatus': done ? 'processed' : 'pending',
          ...(done && { 'payment.refundedAt': new Date() }),
        },
        $unset: { 'payment.refundError': '' },
      },
      { new: true }
    )
  } catch (err) {
    console.error(`Refund failed for ${booking.bookingCode}:`, describe(err))
    return await Booking.findByIdAndUpdate(
      booking._id,
      { $set: { 'payment.refundStatus': 'failed', 'payment.refundError': describe(err).slice(0, 300) } },
      { new: true }
    )
  }
}

// Called by the 60s sweeper: tries failed refunds again (up to MAX_ATTEMPTS, 5 min apart)
export async function retryFailedRefunds() {
  const due = await Booking.find({
    'payment.refundStatus': 'failed',
    'payment.refundAttempts': { $lt: MAX_ATTEMPTS },
    updatedAt: { $lt: new Date(Date.now() - RETRY_AFTER_MS) },
  }).limit(20)

  for (const booking of due) {
    await refundBooking(booking, { reason: 'Retry' })
  }
}