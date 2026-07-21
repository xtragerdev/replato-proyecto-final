import { User } from '../models/User.js'
import { ApiError } from '../utils/ApiError.js'

export const userService = {
  async list() {
    return User.find({}).sort({ createdAt: -1 }).lean()
  },

  async updateRole(id, role, actorId) {
    if (id === actorId && role !== 'admin') {
      throw new ApiError(400, 'No puedes retirar tu propio rol de administrador', 'SELF_ROLE_CHANGE')
    }
    const user = await User.findByIdAndUpdate(id, { role }, { new: true, runValidators: true }).lean()
    if (!user) throw new ApiError(404, 'El usuario no existe', 'USER_NOT_FOUND')
    return user
  },
}

