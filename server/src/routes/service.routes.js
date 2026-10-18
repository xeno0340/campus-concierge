import { Router } from 'express'
import {
  listServices,
  listManaged,
  getService,
  createService,
  updateService,
  deactivateService,
} from '../controllers/service.controller.js'
import { protect, authorize } from '../middleware/auth.js'
import { getAvailability } from '../controllers/booking.controller.js'
import { validate } from '../middleware/validate.js'
import { createServiceSchema, updateServiceSchema } from '../validators/service.validators.js'

const router = Router()

// Public: anyone can browse
router.get('/', listServices)
router.get('/:id/availability', getAvailability)

// Must be declared before '/:id'
router.get('/manage/list', protect, authorize('admin', 'manager'), listManaged)

router.get('/:id', getService)

router.post('/', protect, authorize('admin'), validate(createServiceSchema), createService)
router.patch('/:id', protect, authorize('admin', 'manager'), validate(updateServiceSchema), updateService)
router.delete('/:id', protect, authorize('admin'), deactivateService)

export default router