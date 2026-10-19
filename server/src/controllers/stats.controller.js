import Booking from '../models/Booking.js'
import Service from '../models/Service.js'
import { asyncHandler } from '../utils/asyncHandler.js'

const IST_MS = 330 * 60000
const istDay = (d) => new Date(d.getTime() + IST_MS).toISOString().slice(0, 10)

const PAID = ['confirmed', 'checked_in', 'completed', 'no_show']
const LIVE = ['pending_approval', 'awaiting_payment', 'confirmed', 'checked_in', 'completed', 'no_show']
const LOST = ['rejected', 'cancelled', 'expired']

const dayOf = (field) => ({
  $dateToString: { format: '%Y-%m-%d', date: `$${field}`, timezone: 'Asia/Kolkata' },
})

// GET /api/stats/overview?days=30   (manager: own services only, admin: everything)
export const overview = asyncHandler(async (req, res) => {
  const days = [7, 30, 90].includes(Number(req.query.days)) ? Number(req.query.days) : 30

  // every IST calendar day in the range, so empty days show as zero
  const dayList = Array.from({ length: days }, (_, i) =>
    istDay(new Date(Date.now() - (days - 1 - i) * 86400000))
  )
  const from = new Date(`${dayList[0]}T00:00:00+05:30`)

  const scope = {}
  if (req.user.role === 'manager') {
    scope.service = { $in: await Service.find({ manager: req.user._id }).distinct('_id') }
  }

  const [created, revenue, top, statuses, pending] = await Promise.all([
    Booking.aggregate([
      { $match: { ...scope, createdAt: { $gte: from } } },
      { $group: { _id: dayOf('createdAt'), count: { $sum: 1 } } },
    ]),
    Booking.aggregate([
      { $match: { ...scope, status: { $in: PAID }, amount: { $gt: 0 }, confirmedAt: { $gte: from } } },
      { $group: { _id: dayOf('confirmedAt'), total: { $sum: '$amount' } } },
    ]),
    Booking.aggregate([
      { $match: { ...scope, status: { $in: LIVE }, createdAt: { $gte: from } } },
      { $group: { _id: '$service', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ]),
    Booking.aggregate([
      { $match: { ...scope, createdAt: { $gte: from } } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
    Booking.countDocuments({ ...scope, status: 'pending_approval' }),
  ])

  const createdBy = new Map(created.map((r) => [r._id, r.count]))
  const revenueBy = new Map(revenue.map((r) => [r._id, r.total]))
  const perDay = dayList.map((date) => ({
    date,
    bookings: createdBy.get(date) || 0,
    revenue: revenueBy.get(date) || 0,
  }))

  const services = await Service.find({ _id: { $in: top.map((t) => t._id) } }).select('name')
  const nameOf = new Map(services.map((s) => [String(s._id), s.name]))
  const topServices = top.map((t) => ({ name: nameOf.get(String(t._id)) || 'Removed service', count: t.count }))

  const total = statuses.reduce((n, s) => n + s.count, 0)
  const lost = statuses.filter((s) => LOST.includes(s._id)).reduce((n, s) => n + s.count, 0)

  res.json({
    success: true,
    days,
    totals: {
      bookings: total,
      revenue: perDay.reduce((n, d) => n + d.revenue, 0),
      pending,
      lostRate: total ? Math.round((lost / total) * 100) : 0,
    },
    perDay,
    topServices,
  })
})