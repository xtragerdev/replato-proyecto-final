import mongoose from 'mongoose'
import { createApp } from '../server/src/app.js'
import { connectDatabase } from '../server/src/config/database.js'
import { env } from '../server/src/config/env.js'

const app = createApp()
let connectionPromise

export function restoreApiRequestPath(request) {
  const target = new URL(request.url, 'http://localhost')
  const path = target.searchParams.get('path')

  if (target.pathname !== '/api' || !path) return

  target.searchParams.delete('path')
  const search = target.searchParams.toString()
  request.url = `/api/${path.replace(/^\/+/, '')}${search ? `?${search}` : ''}`
}

async function ensureDatabaseConnection() {
  if (mongoose.connection.readyState === 1) return

  if (!connectionPromise) {
    connectionPromise = connectDatabase(env.mongoUri).catch((error) => {
      connectionPromise = undefined
      throw error
    })
  }

  await connectionPromise
}

export default async function handler(request, response) {
  try {
    restoreApiRequestPath(request)
    await ensureDatabaseConnection()
    return app(request, response)
  } catch {
    return response.status(503).json({
      error: {
        code: 'DATABASE_UNAVAILABLE',
        message: 'La base de datos no está disponible temporalmente',
      },
    })
  }
}
