import { userService } from '../services/userService.js'
import { asyncHandler } from '../utils/asyncHandler.js'

export const listUsers = asyncHandler(async (_req, res) => {
  const users = await userService.list()
  res.json({ data: users, meta: { total: users.length } })
})

export const updateUserRole = asyncHandler(async (req, res) => {
  const user = await userService.updateRole(req.params.id, req.validated.body.role, req.user._id.toString())
  res.json({ data: user })
})

