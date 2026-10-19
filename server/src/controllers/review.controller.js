import mongoose from 'mongoose'
import Review from '../models/Review.js'
import Booking from '../models/Booking.js'
import Service from '../models/Service.js'
import { AppError } from '../utils/AppError.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { getPagination } from '../utils/query.js'

const REVIEWABLE = ['checked_in', 'completed']

// "Priya Sharma" -> "Priya S." so public reviews do not expose full names
const shortName = (name = 'Student') => {
  const parts = String(name).trim().split(/\s+/)
  return parts.length > 1 ? `${parts[0]} ${parts[parts.length - 1][0].toUpperCase()}.` : parts[0]
}

// Recalculate the average from the reviews themselves, so it can never drift
async function refreshServiceRating(serviceId) {
  const [row] = await Review.aggregate([
    { $match: { service: new mongoose.Types.ObjectId(String(serviceId)) } },
    { $group: { _id: '$service', avg: { $avg: '$rating' }, count: { $sum: 1 } } },
  ])
  await Service.updateOne(
    { _id: serviceId },
    { ratingAvg: row ? Math.round(row.avg * 10) / 10 : 0, ratingCount: row?.count ?? 0 }
  )
}

// POST /api/reviews   { bookingId, rating, comment }
export const createReview = asyncHandler(async (req, res) => {
  const { bookingId, rating, comment } = req.body

  const booking = await Booking.findById(bookingId)
  // same message for "missing" and "not yours", so ids cannot be probed
  if (!booking || String(booking.user) !== req.user.id) throw new AppError('Booking not found', 404)

  if (!REVIEWABLE.includes(booking.status)) {
    throw new AppError('You can review a booking after you have attended it', 400)
  }

  try {
    const review = await Review.create({
      booking: booking._id,
      user: req.user._id,
      service: booking.service,
      rating,
      comment: comment || '',
    })
    await refreshServiceRating(booking.service)
    res.status(201).json({ success: true, review })
  } catch (err) {
    if (err.code === 11000) throw new AppError('You have already reviewed this booking', 409)
    throw err
  }
})

// GET /api/reviews/service/:serviceId   (public)
export const serviceReviews = asyncHandler(async (req, res) => {
  const { serviceId } = req.params
  if (!/^[a-f\d]{24}$/i.test(serviceId)) throw new AppError('Invalid service id', 400)

  const { page, limit, skip } = getPagination(req.query, 5, 20)
  const [reviews, total, service] = await Promise.all([
    Review.find({ service: serviceId }).populate('user', 'name').sort({ createdAt: -1 }).skip(skip).limit(limit),
    Review.countDocuments({ service: serviceId }),
    Service.findById(serviceId).select('ratingAvg ratingCount'),
  ])

  res.json({
    success: true,
    summary: { average: service?.ratingAvg ?? 0, count: service?.ratingCount ?? 0 },
    reviews: reviews.map((r) => ({
      _id: r._id,
      rating: r.rating,
      comment: r.comment,
      createdAt: r.createdAt,
      author: shortName(r.user?.name),
    })),
    pagination: { page, limit, total, pages: Math.max(1, Math.ceil(total / limit)) },
  })
})

// GET /api/reviews/mine  - which bookings I have already reviewed
export const myReviews = asyncHandler(async (req, res) => {
  const reviews = await Review.find({ user: req.user._id }).select('booking rating comment createdAt')
  res.json({ success: true, reviews })
})

// GET /api/reviews/manage  - feedback on the services a manager runs (admin sees all)
export const manageReviews = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query, 10, 50)

  const filter = {}
  if (req.user.role === 'manager') {
    const ids = await Service.find({ manager: req.user._id }).distinct('_id')
    filter.service = { $in: ids }
  }

  const [reviews, total] = await Promise.all([
    Review.find(filter)
      .populate('user', 'name')
      .populate('service', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Review.countDocuments(filter),
  ])

  res.json({
    success: true,
    reviews: reviews.map((r) => ({
      _id: r._id,
      rating: r.rating,
      comment: r.comment,
      createdAt: r.createdAt,
      author: shortName(r.user?.name),
      service: r.service ? { _id: r.service._id, name: r.service.name } : null,
    })),
    pagination: { page, limit, total, pages: Math.max(1, Math.ceil(total / limit)) },
  })
})