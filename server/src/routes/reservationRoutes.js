import { Router } from 'express'
import {
  cancelReservation,
  createReservation,
  listMyReservations,
  listReceivedReservations,
  updateReservationStatus,
} from '../controllers/reservationController.js'
import { authenticate, authorize } from '../middleware/authenticate.js'
import { validate } from '../middleware/validate.js'
import { reservationCancelSchema, reservationCreateSchema, reservationStatusSchema } from '../validators/schemas.js'

export const reservationRouter = Router()

reservationRouter.use(authenticate)
reservationRouter.post('/', authorize('user'), validate(reservationCreateSchema), createReservation)
reservationRouter.get('/mine', listMyReservations)
reservationRouter.get('/received', authorize('partner', 'admin'), listReceivedReservations)
reservationRouter.patch('/:id/status', authorize('partner', 'admin'), validate(reservationStatusSchema), updateReservationStatus)
reservationRouter.delete('/:id', validate(reservationCancelSchema), cancelReservation)
