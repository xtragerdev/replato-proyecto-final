import { Router } from 'express'
import { listUsers, updateUserRole } from '../controllers/userController.js'
import { authenticate, authorize } from '../middleware/authenticate.js'
import { validate } from '../middleware/validate.js'
import { roleSchema } from '../validators/schemas.js'

export const userRouter = Router()

userRouter.use(authenticate, authorize('admin'))
userRouter.get('/', listUsers)
userRouter.patch('/:id/role', validate(roleSchema), updateUserRole)

