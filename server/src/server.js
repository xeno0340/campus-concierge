import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import cookieParser from 'cookie-parser'
import { connectDB } from './config/db.js'
import authRoutes from './routes/auth.routes.js'
import userRoutes from './routes/user.routes.js'
import serviceRoutes from './routes/service.routes.js'
import { notFound, errorHandler } from './middleware/errorHandler.js'
import bookingRoutes from './routes/booking.routes.js'
import { expireStaleHolds, finishPastBookings } from './lib/bookingEngine.js'
import paymentRoutes from './routes/payment.routes.js'
import { razorpayWebhook } from './controllers/payment.controller.js'
import { retryFailedRefunds } from './lib/refunds.js'
import statsRoutes from './routes/stats.routes.js'
import reviewRoutes from './routes/review.routes.js'
import { validateEnv, allowedOrigins } from './config/env.js'
import { apiLimiter } from './middleware/limiters.js'

validateEnv()

const app = express()

if (process.env.NODE_ENV === 'production') app.set('trust proxy', 1)

app.use(helmet())
const origins = allowedOrigins()
app.use(
  cors({
    // requests with no Origin (curl, Razorpay's webhook, same-site) are not browser cross-site calls
    origin: (origin, cb) => cb(null, !origin || origins.includes(origin)),
    credentials: true,
  })
)
// Razorpay's webhook needs the raw body to check its signature, so it goes BEFORE express.json
app.post('/api/payments/webhook', express.raw({ type: 'application/json', limit: '100kb' }), razorpayWebhook)

app.use(express.json({ limit: '10kb' }))
app.use((req, res, next) => {
  req.body ??= {} // routes that read req.body.x never crash on an empty body
  next()
})
app.use(cookieParser())
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'))

app.get('/api/health', (req, res) => {
  res.json({ ok: true, message: 'Backend and database are connected' })
})

app.use('/api', apiLimiter)

app.use('/api/auth', authRoutes)
app.use('/api/users', userRoutes)
app.use('/api/services', serviceRoutes)
app.use('/api/bookings', bookingRoutes)
app.use('/api/payments', paymentRoutes)
app.use('/api/stats', statsRoutes)
app.use('/api/reviews', reviewRoutes)

app.use(notFound)
app.use(errorHandler)

const PORT = process.env.PORT || 5000

connectDB().then(() => {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`))

  // Every minute, free seats held by unpaid or unanswered bookings, close out finished bookings, and retry any failed refunds
  setInterval(() => {
    expireStaleHolds().catch((e) => console.error('Hold sweep failed:', e.message))
    finishPastBookings().catch((e) => console.error('Finish sweep failed:', e.message))
    retryFailedRefunds().catch((e) => console.error('Refund retry failed:', e.message))
  }, 60 * 1000)
})

// Log anything that slips through instead of dying silently
process.on('unhandledRejection', (reason) => console.error('Unhandled rejection:', reason))
process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err)
  process.exit(1)
})