import jwt from 'jsonwebtoken'

const isProd = process.env.NODE_ENV === 'production'

export const cookieOptions = {
  httpOnly: true,
  secure: isProd,
  sameSite: isProd ? 'none' : 'lax',
}

export function signToken(userId) {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  })
}

export function sendAuth(res, user, statusCode = 200) {
  const token = signToken(user._id)
  res.cookie('token', token, {
    ...cookieOptions,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  })
  res.status(statusCode).json({ success: true, user })
}