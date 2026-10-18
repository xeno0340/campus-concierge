import User, { ROLES } from '../models/User.js'
import { AppError } from '../utils/AppError.js'
import { asyncHandler } from '../utils/asyncHandler.js'

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

// GET /api/users?page=1&limit=10&role=student&q=ali
export const listUsers = asyncHandler(async (req, res) => {
  const page = Math.max(parseInt(req.query.page) || 1, 1)
  const limit = Math.min(Math.max(parseInt(req.query.limit) || 10, 1), 50)

  const filter = {}
  if (ROLES.includes(req.query.role)) filter.role = req.query.role
  if (req.query.q) {
    const q = escapeRegex(String(req.query.q))
    filter.$or = [
      { name: { $regex: q, $options: 'i' } },
      { email: { $regex: q, $options: 'i' } },
    ]
  }

  const [users, total] = await Promise.all([
    User.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    User.countDocuments(filter),
  ])

  res.json({
    success: true,
    users,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  })
})

export const getUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id)
  if (!user) throw new AppError('User not found', 404)
  res.json({ success: true, user })
})

export const createUser = asyncHandler(async (req, res) => {
  const exists = await User.findOne({ email: req.body.email })
  if (exists) throw new AppError('An account with this email already exists', 409)

  const user = await User.create(req.body)
  res.status(201).json({ success: true, user })
})

export const updateRole = asyncHandler(async (req, res) => {
  if (req.params.id === req.user.id) {
    throw new AppError('You cannot change your own role', 400)
  }
  const user = await User.findByIdAndUpdate(
    req.params.id,
    { role: req.body.role },
    { new: true, runValidators: true }
  )
  if (!user) throw new AppError('User not found', 404)
  res.json({ success: true, user })
})

export const updateStatus = asyncHandler(async (req, res) => {
  if (req.params.id === req.user.id) {
    throw new AppError('You cannot deactivate your own account', 400)
  }
  const user = await User.findByIdAndUpdate(
    req.params.id,
    { isActive: req.body.isActive },
    { new: true }
  )
  if (!user) throw new AppError('User not found', 404)
  res.json({ success: true, user })
})

export const updateMe = asyncHandler(async (req, res) => {
  const user = await User.findByIdAndUpdate(req.user.id, req.body, {
    new: true,
    runValidators: true,
  })
  res.json({ success: true, user })
})