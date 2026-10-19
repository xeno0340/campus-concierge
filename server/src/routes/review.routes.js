import { Router } from 'express'
import { createReview, serviceReviews, myReviews, manageReviews } from '../controllers/review.controller.js'
import { protect, authorize } from '../middleware/auth.js'
import { validate } from '../middleware/validate.js'
import { createReviewSchema } from '../validators/review.validators.js'

const router = Router()

// Public: anyone can read a service's reviews
router.get('/service/:serviceId', serviceReviews)

router.use(protect)

router.post('/', authorize('student', 'faculty'), validate(createReviewSchema), createReview)
router.get('/mine', authorize('student', 'faculty'), myReviews)
router.get('/manage', authorize('manager', 'admin'), manageReviews)

export default router