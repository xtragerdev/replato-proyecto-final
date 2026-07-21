import { createApp } from './app.js'
import { connectDatabase, disconnectDatabase } from './config/database.js'
import { env } from './config/env.js'

async function start() {
  try {
    await connectDatabase(env.mongoUri)
    const server = createApp().listen(env.port, () => {
      console.log(`RePlato API disponible en http://localhost:${env.port}`)
    })

    const shutdown = () => {
      server.close(async () => {
        await disconnectDatabase()
        process.exit(0)
      })
    }
    process.on('SIGINT', shutdown)
    process.on('SIGTERM', shutdown)
  } catch (error) {
    console.error('No se pudo iniciar la API:', error.message)
    process.exit(1)
  }
}

start()
