import rateLimit, { ipKeyGenerator } from 'express-rate-limit'

const isProd = process.env.NODE_ENV === 'production'
const tooMany = (message) => ({ success: false, message })

// Everything under /api, per IP. Generous: it only stops floods.
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: isProd ? 600 : 5000,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: tooMany('Too many requests. Please slow down and try again shortly.'),
})

// Actions that create things or touch money, counted per logged-in user
// (use AFTER protect so req.user exists)
const perUser = (req) => (req.user ? `u:${req.user.id}` : ipKeyGenerator(req.ip))

export const bookingWriteLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: isProd ? 40 : 1000,
  keyGenerator: perUser,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: tooMany('You are making bookings too quickly. Please try again later.'),
})

export const paymentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: isProd ? 30 : 500,
  keyGenerator: perUser,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: tooMany('Too many payment attempts. Please wait a few minutes.'),
})