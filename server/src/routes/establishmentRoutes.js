import { Router } from 'express'
import {
  createEstablishment,
  deleteEstablishment,
  getEstablishment,
  listEstablishments,
  listMyEstablishments,
  updateEstablishment,
} from '../controllers/establishmentController.js'
import { authenticate, authorize } from '../middleware/authenticate.js'
import { validate } from '../middleware/validate.js'
import { establishmentCreateSchema, establishmentUpdateSchema } from '../validators/schemas.js'

export const establishmentRouter = Router()

establishmentRouter.get('/', listEstablishments)
establishmentRouter.get('/mine', authenticate, authorize('partner', 'admin'), listMyEstablishments)
establishmentRouter.post('/', authenticate, authorize('partner', 'admin'), validate(establishmentCreateSchema), createEstablishment)
establishmentRouter.get('/:idOrSlug', getEstablishment)
establishmentRouter.patch('/:id', authenticate, authorize('partner', 'admin'), validate(establishmentUpdateSchema), updateEstablishment)
establishmentRouter.delete('/:id', authenticate, authorize('partner', 'admin'), deleteEstablishment)

