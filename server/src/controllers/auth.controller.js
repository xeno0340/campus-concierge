import User from '../models/User.js'
import { AppError } from '../utils/AppError.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { sendAuth, cookieOptions } from '../utils/token.js'

export const register = asyncHandler(async (req, res) => {
  const { name, email, password, department, phone } = req.body

  const exists = await User.findOne({ email })
  if (exists) throw new AppError('An account with this email already exists', 409)

  // role is forced to 'student' on purpose - never trust the client for roles
  const user = await User.create({ name, email, password, department, phone, role: 'student' })
  sendAuth(res, user, 201)
})

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body

  const user = await User.findOne({ email }).select('+password')
  const ok = user && (await user.comparePassword(password))
  if (!ok) throw new AppError('Invalid email or password', 401)
  if (!user.isActive) throw new AppError('This account has been deactivated', 403)

  sendAuth(res, user)
})

export const logout = (req, res) => {
  res.clearCookie('token', cookieOptions)
  res.json({ success: true, message: 'Logged out' })
}

export const me = (req, res) => {
  res.json({ success: true, user: req.user })
}