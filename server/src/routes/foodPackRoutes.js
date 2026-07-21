import { Router } from 'express'
import {
  createFoodPack,
  deleteFoodPack,
  getFoodPack,
  getImpact,
  listFeaturedPacks,
  listFoodPacks,
  listMyFoodPacks,
  updateFoodPack,
} from '../controllers/foodPackController.js'
import { authenticate, authorize } from '../middleware/authenticate.js'
import { imageUpload } from '../middleware/upload.js'
import { validate } from '../middleware/validate.js'
import { foodPackCreateSchema, foodPackUpdateSchema, packQuerySchema } from '../validators/schemas.js'

export const foodPackRouter = Router()

foodPackRouter.get('/', validate(packQuerySchema, 'query'), listFoodPacks)
foodPackRouter.get('/featured', listFeaturedPacks)
foodPackRouter.get('/impact', getImpact)
foodPackRouter.get('/mine', authenticate, authorize('partner', 'admin'), listMyFoodPacks)
foodPackRouter.post('/', authenticate, authorize('partner', 'admin'), imageUpload.single('image'), validate(foodPackCreateSchema), createFoodPack)
foodPackRouter.get('/:id', getFoodPack)
foodPackRouter.patch('/:id', authenticate, authorize('partner', 'admin'), imageUpload.single('image'), validate(foodPackUpdateSchema), updateFoodPack)
foodPackRouter.delete('/:id', authenticate, authorize('partner', 'admin'), deleteFoodPack)

