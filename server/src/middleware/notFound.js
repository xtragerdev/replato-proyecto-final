import { ApiError } from '../utils/ApiError.js'

export function notFound(req, _res, next) {
  next(new ApiError(404, `No existe la ruta ${req.method} ${req.originalUrl}`, 'ROUTE_NOT_FOUND'))
}

