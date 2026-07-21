import 'dotenv/config'

function splitOrigins(value) {
  return value.split(',').map((origin) => origin.trim()).filter(Boolean)
}

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT) || 4000,
  mongoUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/replato',
  jwtSecret: process.env.JWT_SECRET || 'development-secret-change-me',
  clientOrigins: splitOrigins(process.env.CLIENT_URL || 'http://localhost:5173'),
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
    apiKey: process.env.CLOUDINARY_API_KEY || '',
    apiSecret: process.env.CLOUDINARY_API_SECRET || '',
  },
  seedPassword: process.env.SEED_DEFAULT_PASSWORD || 'RePlato2026!',
}

