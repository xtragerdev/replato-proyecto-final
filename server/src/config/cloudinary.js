import { v2 as cloudinary } from 'cloudinary'
import { env } from './env.js'
import { ApiError } from '../utils/ApiError.js'

const isConfigured = Boolean(
  env.cloudinary.cloudName && env.cloudinary.apiKey && env.cloudinary.apiSecret,
)

if (isConfigured) {
  cloudinary.config({
    cloud_name: env.cloudinary.cloudName,
    api_key: env.cloudinary.apiKey,
    api_secret: env.cloudinary.apiSecret,
    secure: true,
  })
}

export function uploadImage(buffer, folder = 'replato/offers') {
  if (!isConfigured) {
    throw new ApiError(503, 'La subida de imágenes no está configurada')
  }

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: 'image', transformation: [{ width: 1400, crop: 'limit', quality: 'auto' }] },
      (error, result) => {
        if (error) reject(new ApiError(502, 'No se pudo subir la imagen'))
        else resolve({ url: result.secure_url, publicId: result.public_id })
      },
    )
    stream.end(buffer)
  })
}

export async function deleteImage(publicId) {
  if (!isConfigured || !publicId) return
  await cloudinary.uploader.destroy(publicId)
}

