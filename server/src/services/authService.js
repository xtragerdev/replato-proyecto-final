import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'
import { User } from '../models/User.js'
import { ApiError } from '../utils/ApiError.js'

function serializeUser(user) {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    phone: user.phone,
    city: user.city,
    postalCode: user.postalCode,
    avatarUrl: user.avatarUrl,
    dietaryPreferences: user.dietaryPreferences,
  }
}

function createToken(user) {
  return jwt.sign({ sub: user._id.toString(), role: user.role }, env.jwtSecret, { expiresIn: '7d' })
}

export const authService = {
  async register(input) {
    const exists = await User.exists({ email: input.email })
    if (exists) throw new ApiError(409, 'Ya existe una cuenta con ese correo', 'EMAIL_IN_USE')

    const passwordHash = await bcrypt.hash(input.password, 12)
    const user = await User.create({
      name: input.name,
      email: input.email,
      passwordHash,
      role: 'user',
      city: input.city,
      newsletterOptIn: input.newsletterOptIn,
    })

    return { user: serializeUser(user), token: createToken(user) }
  },

  async login(input) {
    const user = await User.findOne({ email: input.email, isActive: true }).select('+passwordHash')
    if (!user || !(await bcrypt.compare(input.password, user.passwordHash))) {
      throw new ApiError(401, 'Correo o contraseña incorrectos', 'INVALID_CREDENTIALS')
    }

    return { user: serializeUser(user), token: createToken(user) }
  },

  serializeUser,
}

