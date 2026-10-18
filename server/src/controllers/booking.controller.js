import Booking, { STATUSES } from '../models/Booking.js'
import Service from '../models/Service.js'
import Slot from '../models/Slot.js'
import { AppError } from '../utils/AppError.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { getPagination } from '../utils/query.js'
import { checkBookableDate, generateSlots, todayLocal } from '../lib/slots.js'
import {
  createBooking as createBookingRecord,
  transition,
  expireStaleHolds,
  holdUntil,
  APPROVED_PAY_HOURS,
} from '../lib/bookingEngine.js'

const MAX_ACTIVE = { student: 5, faculty: 20 }
const CANCEL_CUTOFF_HOURS = 2

const paginate = (page, limit, total) => ({ page, limit, total, pages: Math.ceil(total / limit) })

// GET /api/services/:id/availability?date=2026-10-21
export const getAvailability = asyncHandler(async (req, res) => {
  const service = await Service.findOne({ _id: req.params.id, isActive: true })
  if (!service) throw new AppError('Service not found', 404)

  const date = String(req.query.date || todayLocal())
  const problem = checkBookableDate(service, date)
  if (problem) throw new AppError(problem, 400)

  await expireStaleHolds()

  const generated = generateSlots(service, date)
  const existing = generated.length
    ? await Slot.find({
        service: service._id,
        start: { $gte: generated[0].start, $lte: generated[generated.length - 1].start },
      })
    : []

  const byStart = new Map(existing.map((s) => [s.start.getTime(), s]))
  const now = Date.now()

  const slots = generated.map((g) => {
    const doc = byStart.get(g.start.getTime())
    const remaining = doc ? Math.max(doc.capacity - doc.booked, 0) : service.capacity
    return {
      time: g.label,
      start: g.start,
      end: g.end,
      remaining,
      available: remaining > 0 && g.start.getTime() > now,
    }
  })

  res.json({
    success: true,
    date,
    service: {
      id: service._id,
      name: service.name,
      price: service.price,
      capacity: service.capacity,
      slotMinutes: service.slotMinutes,
    },
    slots,
  })
})

// POST /api/bookings
export const createBooking = asyncHandler(async (req, res) => {
  const { serviceId, date, startTime, notes } = req.body

  const service = await Service.findOne({ _id: serviceId, isActive: true })
  if (!service) throw new AppError('Service not found', 404)

  if (!service.bookableBy.includes(req.user.role)) {
    throw new AppError(`This service can only be booked by: ${service.bookableBy.join(', ')}`, 403)
  }

  const problem = checkBookableDate(service, date)
  if (problem) throw new AppError(problem, 400)

  const slot = generateSlots(service, date).find((s) => s.label === startTime)
  if (!slot) throw new AppError('That start time is not a valid slot for this service', 400)
  if (slot.start.getTime() <= Date.now()) throw new AppError('That slot has already started', 400)

  await expireStaleHolds()

  const activeCount = await Booking.countDocuments({
    user: req.user._id,
    status: { $in: ['pending_approval', 'awaiting_payment', 'confirmed'] },
    start: { $gte: new Date() },
  })
  if (activeCount >= MAX_ACTIVE[req.user.role]) {
    throw new AppError(
      `You can have at most ${MAX_ACTIVE[req.user.role]} upcoming bookings at once`,
      400
    )
  }

  const booking = await createBookingRecord({
    user: req.user._id,
    service,
    start: slot.start,
    end: slot.end,
    notes,
  })
  await booking.populate('service', 'name category location price')

  res.status(201).json({ success: true, booking })
})

// GET /api/bookings/mine?status=confirmed&page=1
export const myBookings = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query, 10, 50)
  await expireStaleHolds()

  const filter = { user: req.user._id }
  if (STATUSES.includes(req.query.status)) filter.status = req.query.status

  const [bookings, total] = await Promise.all([
    Booking.find(filter)
      .populate('service', 'name category location price')
      .sort({ start: -1 })
      .skip(skip)
      .limit(limit),
    Booking.countDocuments(filter),
  ])

  res.json({ success: true, bookings, pagination: paginate(page, limit, total) })
})

// GET /api/bookings/:id  (owner, that service's manager, or admin)
export const getBooking = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id)
    .populate('service', 'name category location price manager')
    .populate('user', 'name email department')
  if (!booking) throw new AppError('Booking not found', 404)

  const isOwner = String(booking.user._id) === req.user.id
  const isAdmin = req.user.role === 'admin'
  const isManager = String(booking.service.manager) === req.user.id
  if (!isOwner && !isAdmin && !isManager) {
    throw new AppError('You do not have access to this booking', 403)
  }

  res.json({ success: true, booking })
})

// PATCH /api/bookings/:id/cancel
export const cancelBooking = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id)
  if (!booking) throw new AppError('Booking not found', 404)

  const isOwner = String(booking.user) === req.user.id
  const isAdmin = req.user.role === 'admin'
  if (!isOwner && !isAdmin) throw new AppError('You can only cancel your own bookings', 403)

  const msUntilStart = booking.start.getTime() - Date.now()
  if (booking.status === 'confirmed' && !isAdmin && msUntilStart < CANCEL_CUTOFF_HOURS * 3600000) {
    throw new AppError(
      `Confirmed bookings can only be cancelled up to ${CANCEL_CUTOFF_HOURS} hours before the start`,
      400
    )
  }

  const updated = await transition(booking, 'cancelled', {
    by: req.user._id,
    note: req.body.reason || 'Cancelled',
  })
  res.json({ success: true, booking: updated })
})

// ---- manager / admin ----

async function loadForManagement(req) {
  const booking = await Booking.findById(req.params.id).populate('service', 'name manager')
  if (!booking) throw new AppError('Booking not found', 404)

  const isAdmin = req.user.role === 'admin'
  const isManager = String(booking.service.manager) === req.user.id
  if (!isAdmin && !isManager) {
    throw new AppError('You can only manage bookings for your own services', 403)
  }
  return booking
}

// GET /api/bookings/manage/list?status=pending_approval
export const manageList = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query, 20, 50)
  await expireStaleHolds()

  const filter = {}
  if (req.user.role === 'manager') {
    const ids = await Service.find({ manager: req.user._id }).distinct('_id')
    filter.service = { $in: ids }
  }
  if (STATUSES.includes(req.query.status)) filter.status = req.query.status

  const [bookings, total] = await Promise.all([
    Booking.find(filter)
      .populate('user', 'name email department')
      .populate('service', 'name category')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Booking.countDocuments(filter),
  ])

  res.json({ success: true, bookings, pagination: paginate(page, limit, total) })
})

// PATCH /api/bookings/:id/approve
export const approveBooking = asyncHandler(async (req, res) => {
  const booking = await loadForManagement(req)

  if (booking.status !== 'pending_approval') {
    throw new AppError('Only bookings waiting for approval can be approved', 400)
  }
  if (booking.start.getTime() <= Date.now()) {
    throw new AppError('This slot has already started', 400)
  }

  const free = booking.amount === 0
  const updated = await transition(booking, free ? 'confirmed' : 'awaiting_payment', {
    by: req.user._id,
    note: free ? 'Approved and confirmed' : 'Approved, awaiting payment',
    set: free
      ? { confirmedAt: new Date() }
      : { holdExpiresAt: holdUntil(APPROVED_PAY_HOURS * 3600000, booking.start) },
  })

  res.json({ success: true, booking: updated })
})

// PATCH /api/bookings/:id/reject
export const rejectBooking = asyncHandler(async (req, res) => {
  const booking = await loadForManagement(req)
  const updated = await transition(booking, 'rejected', {
    by: req.user._id,
    note: req.body.reason,
  })
  res.json({ success: true, booking: updated })
})