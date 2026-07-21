import { establishmentService } from '../services/establishmentService.js'
import { asyncHandler } from '../utils/asyncHandler.js'

export const listEstablishments = asyncHandler(async (req, res) => {
  const data = await establishmentService.list(req.query)
  res.json({ data, meta: { total: data.length } })
})

export const getEstablishment = asyncHandler(async (req, res) => {
  res.json({ data: await establishmentService.getById(req.params.idOrSlug) })
})

export const listMyEstablishments = asyncHandler(async (req, res) => {
  res.json({ data: await establishmentService.listMine(req.user) })
})

export const createEstablishment = asyncHandler(async (req, res) => {
  const data = await establishmentService.create(req.validated.body, req.user)
  res.status(201).json({ data })
})

export const updateEstablishment = asyncHandler(async (req, res) => {
  res.json({ data: await establishmentService.update(req.params.id, req.validated.body, req.user) })
})

export const deleteEstablishment = asyncHandler(async (req, res) => {
  res.json({ data: await establishmentService.remove(req.params.id, req.user) })
})

