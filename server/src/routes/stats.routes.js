import { Router } from 'express'
import { overview } from '../controllers/stats.controller.js'
import { protect, authorize } from '../middleware/auth.js'

const router = Router()

router.use(protect, authorize('manager', 'admin'))
router.get('/overview', overview)

export default router