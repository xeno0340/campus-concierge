import crypto from 'crypto'
import Slot from '../models/Slot.js'
import Booking, { HOLD_STATES, RELEASING_STATES, TRANSITIONS } from '../models/Booking.js'
import { AppError } from '../utils/AppError.js'
import { notifyTransition } from './notifications.js'

export const CHECKOUT_HOLD_MIN = 10 // instant-confirm services: time to pay
export const APPROVAL_HOLD_HOURS = 24 // time for a manager to respond
export const APPROVED_PAY_HOURS = 24 // time to pay after approval

const pretty = (s) => s.replace(/_/g, ' ')
const makeCode = () => 'CC-' + crypto.randomBytes(4).toString('hex').toUpperCase()

// A hold never outlives the slot itself
export const holdUntil = (ms, slotStart) =>
  new Date(Math.min(Date.now() + ms, slotStart.getTime()))

async function ensureSlot(service, start, end) {
  try {
    await Slot.updateOne(
      { service: service._id, start },
      { $setOnInsert: { end, capacity: service.capacity, booked: 0 } },
      { upsert: true }
    )
  } catch (err) {
    if (err.code !== 11000) throw err // 11000 = another request created it first, which is fine
  }
}

export async function createBooking({ user, service, start, end, notes }) {
  await ensureSlot(service, start, end)

  // THE atomic step: claim a seat only if one is free
  const slot = await Slot.findOneAndUpdate(
    { service: service._id, start, $expr: { $lt: ['$booked', '$capacity'] } },
    { $inc: { booked: 1 } },
    { new: true }
  )
  if (!slot) throw new AppError('Sorry, this slot is fully booked', 409)

  const now = new Date()
  let status
  let holdExpiresAt = null
  let confirmedAt

  if (service.requiresApproval) {
    status = 'pending_approval'
    holdExpiresAt = holdUntil(APPROVAL_HOLD_HOURS * 3600000, start)
  } else if (service.price > 0) {
    status = 'awaiting_payment'
    holdExpiresAt = holdUntil(CHECKOUT_HOLD_MIN * 60000, start)
  } else {
    status = 'confirmed'
    confirmedAt = now
  }

  try {
    return await Booking.create({
      bookingCode: makeCode(),
      user,
      service: service._id,
      slot: slot._id,
      start,
      end,
      amount: service.price,
      status,
      holdsSeat: true,
      holdExpiresAt,
      confirmedAt,
      notes,
      statusHistory: [{ status, at: now, by: user, note: 'Booking created' }],
    })
  } catch (err) {
    // Creating the booking failed, so give the seat back
    await Slot.updateOne({ _id: slot._id }, { $inc: { booked: -1 } })
    if (err.code === 11000 && err.keyPattern?.user) {
      throw new AppError('You already have a booking for this slot', 409)
    }
    throw err
  }
}

// The only place a booking's status changes
export async function transition(booking, next, { by, note, set = {} } = {}) {
  const allowed = TRANSITIONS[booking.status] || []
  if (!allowed.includes(next)) {
    throw new AppError(
      `A ${pretty(booking.status)} booking cannot be changed to ${pretty(next)}`,
      400
    )
  }

  const releasing = RELEASING_STATES.includes(next)

  const updated = await Booking.findOneAndUpdate(
    { _id: booking._id, status: booking.status }, // fails if someone else changed it first
    {
      $set: {
        status: next,
        ...(!HOLD_STATES.includes(next) && { holdExpiresAt: null }),
        ...(releasing && { holdsSeat: false }),
        ...set,
      },
      $push: { statusHistory: { status: next, at: new Date(), by, note } },
    },
    { new: true }
  )
  if (!updated) throw new AppError('This booking was just changed. Please refresh.', 409)

  if (releasing && booking.holdsSeat) {
    await Slot.updateOne({ _id: booking.slot }, { $inc: { booked: -1 } })
  }

  notifyTransition(booking.status, updated, note) // email the student (best effort, never throws)
  return updated
}

// Frees seats held by bookings nobody confirmed or paid for in time
export async function expireStaleHolds() {
  const stale = await Booking.find({
    status: { $in: HOLD_STATES },
    holdExpiresAt: { $lt: new Date() },
  }).limit(200)

  for (const booking of stale) {
    try {
      await transition(booking, 'expired', { note: 'Hold expired' })
    } catch {
      /* someone else just changed it, so skip */
    }
  }
}