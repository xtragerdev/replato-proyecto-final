import multer from 'multer'
import { ApiError } from '../utils/ApiError.js'

export const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, callback) => {
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)) {
      callback(new ApiError(400, 'La imagen debe ser JPG, PNG o WebP', 'INVALID_IMAGE'))
      return
    }
    callback(null, true)
  },
})

