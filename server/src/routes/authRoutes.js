import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { login, me, register } from '../controllers/authController.js'
import { authenticate } from '../middleware/authenticate.js'
import { validate } from '../middleware/validate.js'
import { loginSchema, registerSchema } from '../validators/schemas.js'

export const authRouter = Router()
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 30, standardHeaders: true, legacyHeaders: false })

authRouter.post('/register', authLimiter, validate(registerSchema), register)
authRouter.post('/login', authLimiter, validate(loginSchema), login)
authRouter.get('/me', authenticate, me)

