import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'
import { User } from '../models/User.js'
import { ApiError } from '../utils/ApiError.js'
import { asyncHandler } from '../utils/asyncHandler.js'

export const authenticate = asyncHandler(async (req, _res, next) => {
  const [scheme, token] = (req.headers.authorization || '').split(' ')
  if (scheme !== 'Bearer' || !token) {
    throw new ApiError(401, 'Necesitas iniciar sesión', 'AUTH_REQUIRED')
  }

  let payload
  try {
    payload = jwt.verify(token, env.jwtSecret)
  } catch {
    throw new ApiError(401, 'La sesión no es válida o ha caducado', 'INVALID_TOKEN')
  }

  const user = await User.findOne({ _id: payload.sub, isActive: true }).lean()
  if (!user) throw new ApiError(401, 'El usuario de la sesión ya no está disponible', 'USER_INACTIVE')

  req.user = user
  next()
})

export function authorize(...roles) {
  return (req, _res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new ApiError(403, 'No tienes permiso para realizar esta acción', 'FORBIDDEN'))
    }
    next()
  }
}

