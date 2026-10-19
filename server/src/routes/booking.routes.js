import { Router } from 'express'
import {
  createBooking,
  myBookings,
  getBooking,
  cancelBooking,
  manageList,
  approveBooking,
  rejectBooking,
  checkIn,
} from '../controllers/booking.controller.js'
import { protect, authorize } from '../middleware/auth.js'
import { bookingWriteLimiter } from '../middleware/limiters.js'
import { validate } from '../middleware/validate.js'
import { createBookingSchema, cancelSchema, rejectSchema } from '../validators/booking.validators.js'

const router = Router()

router.use(protect)

router.post('/', authorize('student', 'faculty'), bookingWriteLimiter, validate(createBookingSchema), createBooking)
router.get('/mine', authorize('student', 'faculty'), myBookings)
router.get('/manage/list', authorize('manager', 'admin'), manageList)

router.patch('/check-in', authorize('manager', 'admin'), checkIn)
router.get('/:id', getBooking)
router.patch('/:id/cancel', validate(cancelSchema), cancelBooking)
router.patch('/:id/approve', authorize('manager', 'admin'), approveBooking)
router.patch('/:id/reject', authorize('manager', 'admin'), validate(rejectSchema), rejectBooking)

export default router