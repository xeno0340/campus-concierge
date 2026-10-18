import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { register, login, logout, me } from '../controllers/auth.controller.js'
import { validate } from '../middleware/validate.js'
import { protect } from '../middleware/auth.js'
import { registerSchema, loginSchema } from '../validators/auth.validators.js'

const router = Router()

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: process.env.NODE_ENV === 'production' ? 20 : 200,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { success: false, message: 'Too many attempts. Try again in a few minutes.' },
})

router.post('/register', authLimiter, validate(registerSchema), register)
router.post('/login', authLimiter, validate(loginSchema), login)
router.post('/logout', logout)
router.get('/me', protect, me)

export default router