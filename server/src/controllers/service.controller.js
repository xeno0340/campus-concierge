import Service, { CATEGORIES } from '../models/Service.js'
import User from '../models/User.js'
import { AppError } from '../utils/AppError.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { escapeRegex, getPagination } from '../utils/query.js'

// Fields a manager may change on a service assigned to them
const MANAGER_FIELDS = [
  'description',
  'images',
  'location',
  'openTime',
  'closeTime',
  'openDays',
  'advanceDays',
  'requiresApproval',
]

const SORTS = {
  newest: { createdAt: -1 },
  price_asc: { price: 1 },
  price_desc: { price: -1 },
  rating: { ratingAvg: -1, ratingCount: -1 },
}

async function assertValidManager(id) {
  if (!id) return
  const manager = await User.findOne({ _id: id, role: 'manager', isActive: true })
  if (!manager) {
    throw new AppError('Manager must be an active user with the manager role', 400)
  }
}

// GET /api/services?category=lab&q=court&minPrice=0&maxPrice=500&sort=price_asc&page=1
export const listServices = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query, 9, 24)

  const filter = { isActive: true }

  if (CATEGORIES.includes(req.query.category)) filter.category = req.query.category

  if (req.query.q) {
    const q = escapeRegex(String(req.query.q))
    filter.$or = [
      { name: { $regex: q, $options: 'i' } },
      { description: { $regex: q, $options: 'i' } },
      { location: { $regex: q, $options: 'i' } },
    ]
  }

  const price = {}
  const min = Number(req.query.minPrice)
  const max = Number(req.query.maxPrice)
  if (req.query.minPrice !== undefined && Number.isFinite(min)) price.$gte = min
  if (req.query.maxPrice !== undefined && Number.isFinite(max)) price.$lte = max
  if (Object.keys(price).length) filter.price = price

  const sortKey = String(req.query.sort)
  const sort = Object.hasOwn(SORTS, sortKey) ? SORTS[sortKey] : SORTS.newest

  const [services, total] = await Promise.all([
    Service.find(filter).populate('manager', 'name').sort(sort).skip(skip).limit(limit),
    Service.countDocuments(filter),
  ])

  res.json({
    success: true,
    services,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  })
})

// GET /api/services/manage/list  (admin: everything, manager: only their own)
export const listManaged = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query, 20, 50)
  const filter = req.user.role === 'admin' ? {} : { manager: req.user._id }

  const [services, total] = await Promise.all([
    Service.find(filter).populate('manager', 'name email').sort({ createdAt: -1 }).skip(skip).limit(limit),
    Service.countDocuments(filter),
  ])

  res.json({
    success: true,
    services,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  })
})

export const getService = asyncHandler(async (req, res) => {
  const service = await Service.findOne({ _id: req.params.id, isActive: true }).populate(
    'manager',
    'name'
  )
  if (!service) throw new AppError('Service not found', 404)
  res.json({ success: true, service })
})

export const createService = asyncHandler(async (req, res) => {
  await assertValidManager(req.body.manager)
  const service = await Service.create(req.body)
  await service.populate('manager', 'name email')
  res.status(201).json({ success: true, service })
})

export const updateService = asyncHandler(async (req, res) => {
  const service = await Service.findById(req.params.id)
  if (!service) throw new AppError('Service not found', 404)

  if (req.user.role === 'manager') {
    if (String(service.manager) !== req.user.id) {
      throw new AppError('You can only edit services assigned to you', 403)
    }
    const forbidden = Object.keys(req.body).filter((k) => !MANAGER_FIELDS.includes(k))
    if (forbidden.length) {
      throw new AppError(`Managers cannot change: ${forbidden.join(', ')}`, 403)
    }
  }

  await assertValidManager(req.body.manager)
  Object.assign(service, req.body)
  await service.save()
  await service.populate('manager', 'name email')

  res.json({ success: true, service })
})

// Soft delete: keeps booking history intact
export const deactivateService = asyncHandler(async (req, res) => {
  const service = await Service.findById(req.params.id)
  if (!service) throw new AppError('Service not found', 404)

  service.isActive = false
  await service.save()

  res.json({ success: true, message: 'Service deactivated' })
})