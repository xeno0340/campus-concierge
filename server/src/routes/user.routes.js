import { Router } from 'express'
import {
  listUsers,
  getUser,
  createUser,
  updateRole,
  updateStatus,
  updateMe,
} from '../controllers/user.controller.js'
import { protect, authorize } from '../middleware/auth.js'
import { validate } from '../middleware/validate.js'
import {
  createUserSchema,
  updateRoleSchema,
  updateStatusSchema,
  updateMeSchema,
} from '../validators/user.validators.js'

const router = Router()

// Every route below requires login
router.use(protect)

// Any logged-in user
router.patch('/me', validate(updateMeSchema), updateMe)

// Admin only from here down
router.use(authorize('admin'))

router.route('/').get(listUsers).post(validate(createUserSchema), createUser)
router.get('/:id', getUser)
router.patch('/:id/role', validate(updateRoleSchema), updateRole)
router.patch('/:id/status', validate(updateStatusSchema), updateStatus)

export default router