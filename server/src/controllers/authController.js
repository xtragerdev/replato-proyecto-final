import { authService } from '../services/authService.js'
import { asyncHandler } from '../utils/asyncHandler.js'

export const register = asyncHandler(async (req, res) => {
  const result = await authService.register(req.validated.body)
  res.status(201).json({ data: result })
})

export const login = asyncHandler(async (req, res) => {
  const result = await authService.login(req.validated.body)
  res.json({ data: result })
})

export const me = asyncHandler(async (req, res) => {
  res.json({ data: authService.serializeUser(req.user) })
})

