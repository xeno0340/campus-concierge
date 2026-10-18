import jwt from 'jsonwebtoken'
import User from '../models/User.js'
import { AppError } from '../utils/AppError.js'
import { asyncHandler } from '../utils/asyncHandler.js'

export const protect = asyncHandler(async (req, res, next) => {
  let token = req.cookies?.token
  const header = req.headers.authorization
  if (!token && header?.startsWith('Bearer ')) token = header.split(' ')[1]

  if (!token) throw new AppError('Please log in to continue', 401)

  const decoded = jwt.verify(token, process.env.JWT_SECRET)
  const user = await User.findById(decoded.id)

  if (!user) throw new AppError('This account no longer exists', 401)
  if (!user.isActive) throw new AppError('This account has been deactivated', 403)

  req.user = user
  next()
})

export const authorize =
  (...roles) =>
  (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(new AppError('You do not have permission to do that', 403))
    }
    next()
  }