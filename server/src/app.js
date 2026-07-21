import compression from 'compression'
import cors from 'cors'
import express from 'express'
import helmet from 'helmet'
import mongoose from 'mongoose'
import { env } from './config/env.js'
import { errorHandler } from './middleware/errorHandler.js'
import { notFound } from './middleware/notFound.js'
import { requestId } from './middleware/requestId.js'
import { authRouter } from './routes/authRoutes.js'
import { establishmentRouter } from './routes/establishmentRoutes.js'
import { foodPackRouter } from './routes/foodPackRoutes.js'
import { reservationRouter } from './routes/reservationRoutes.js'
import { userRouter } from './routes/userRoutes.js'

export function createApp() {
  const app = express()
  app.disable('x-powered-by')
  app.use(requestId)
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }))
  app.use(compression())
  app.use(
    cors({
      origin(origin, callback) {
        if (!origin || env.clientOrigins.includes(origin)) return callback(null, true)
        callback(new Error('Origen no permitido por CORS'))
      },
      credentials: true,
    }),
  )
  app.use(express.json({ limit: '30kb' }))

  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
      timestamp: new Date().toISOString(),
    })
  })
  app.get('/api', (_req, res) => {
    res.json({ name: 'RePlato API', version: '1.0.0' })
  })
  app.use('/api/auth', authRouter)
  app.use('/api/users', userRouter)
  app.use('/api/establishments', establishmentRouter)
  app.use('/api/food-packs', foodPackRouter)
  app.use('/api/reservations', reservationRouter)
  app.use(notFound)
  app.use(errorHandler)
  return app
}

