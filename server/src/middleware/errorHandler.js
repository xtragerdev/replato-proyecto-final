import mongoose from 'mongoose'

export function errorHandler(error, req, res, _next) {
  let statusCode = error.statusCode || 500
  let code = error.code || 'INTERNAL_ERROR'
  let message = error.message || 'Error interno del servidor'
  let details = error.details

  if (error instanceof mongoose.Error.ValidationError) {
    statusCode = 400
    code = 'DATABASE_VALIDATION_ERROR'
    message = 'Los datos no cumplen las reglas del modelo'
    details = Object.values(error.errors).map((item) => item.message)
  }

  if (error instanceof mongoose.Error.CastError) {
    statusCode = 400
    code = 'INVALID_ID'
    message = 'El identificador indicado no es válido'
  }

  if (error.code === 11000) {
    statusCode = 409
    code = 'DUPLICATE_RESOURCE'
    message = 'Ya existe un registro con esos datos'
  }

  if (statusCode >= 500 && process.env.NODE_ENV === 'production') {
    message = 'Error interno del servidor'
  }

  res.status(statusCode).json({
    error: {
      code,
      message,
      requestId: req.id,
      ...(details ? { details } : {}),
      ...(process.env.NODE_ENV !== 'production' && statusCode >= 500 ? { stack: error.stack } : {}),
    },
  })
}

