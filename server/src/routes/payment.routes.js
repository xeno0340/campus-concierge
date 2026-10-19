import { Router } from 'express'
import { createOrder, verifyPayment } from '../controllers/payment.controller.js'
import { protect, authorize } from '../middleware/auth.js'

const router = Router()

router.use(protect, authorize('student', 'faculty'))
router.post('/order', createOrder)
router.post('/verify', verifyPayment)

export default router