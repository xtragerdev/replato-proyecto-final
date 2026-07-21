import { reservationService } from '../services/reservationService.js'
import { asyncHandler } from '../utils/asyncHandler.js'

export const createReservation = asyncHandler(async (req, res) => {
  const data = await reservationService.create(req.validated.body, req.user)
  res.status(201).json({ data })
})

export const listMyReservations = asyncHandler(async (req, res) => {
  res.json({ data: await reservationService.listMine(req.user) })
})

export const listReceivedReservations = asyncHandler(async (req, res) => {
  res.json({ data: await reservationService.listReceived(req.user) })
})

export const cancelReservation = asyncHandler(async (req, res) => {
  const data = await reservationService.cancel(req.params.id, req.user, req.validated.body.cancelReason)
  res.json({ data })
})

export const updateReservationStatus = asyncHandler(async (req, res) => {
  const data = await reservationService.updateStatus(req.params.id, req.validated.body.status, req.user)
  res.json({ data })
})
