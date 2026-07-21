import { foodPackService } from '../services/foodPackService.js'
import { asyncHandler } from '../utils/asyncHandler.js'

export const listFoodPacks = asyncHandler(async (req, res) => {
  const result = await foodPackService.list(req.validated.query)
  res.json({ data: result.items, meta: { page: result.page, limit: result.limit, total: result.total, pages: result.pages } })
})

export const listFeaturedPacks = asyncHandler(async (_req, res) => {
  res.json({ data: await foodPackService.featured() })
})

export const getFoodPack = asyncHandler(async (req, res) => {
  res.json({ data: await foodPackService.getById(req.params.id) })
})

export const listMyFoodPacks = asyncHandler(async (req, res) => {
  res.json({ data: await foodPackService.listMine(req.user) })
})

export const createFoodPack = asyncHandler(async (req, res) => {
  const data = await foodPackService.create(req.validated.body, req.user, req.file)
  res.status(201).json({ data })
})

export const updateFoodPack = asyncHandler(async (req, res) => {
  res.json({ data: await foodPackService.update(req.params.id, req.validated.body, req.user, req.file) })
})

export const deleteFoodPack = asyncHandler(async (req, res) => {
  res.json({ data: await foodPackService.remove(req.params.id, req.user) })
})

export const getImpact = asyncHandler(async (_req, res) => {
  res.json({ data: await foodPackService.impact() })
})

