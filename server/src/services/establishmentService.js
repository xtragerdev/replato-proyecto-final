import slugify from 'slugify'
import { Establishment } from '../models/Establishment.js'
import { ApiError } from '../utils/ApiError.js'

function ensureOwner(establishment, user) {
  if (user.role !== 'admin' && establishment.owner.toString() !== user._id.toString()) {
    throw new ApiError(403, 'Solo puedes gestionar tus propios comercios', 'NOT_ESTABLISHMENT_OWNER')
  }
}

export const establishmentService = {
  async list(query = {}) {
    const filter = { isActive: true }
    if (query.city) filter['address.city'] = query.city
    if (query.category) filter.category = query.category
    return Establishment.find(filter).populate('owner', 'name').sort({ isVerified: -1, name: 1 }).lean()
  },

  async getById(idOrSlug) {
    const filter = /^[a-f\d]{24}$/i.test(idOrSlug) ? { _id: idOrSlug } : { slug: idOrSlug }
    const establishment = await Establishment.findOne(filter).populate('owner', 'name avatarUrl').lean()
    if (!establishment) throw new ApiError(404, 'El comercio no existe', 'ESTABLISHMENT_NOT_FOUND')
    return establishment
  },

  async listMine(user) {
    if (user.role === 'admin') return Establishment.find({}).sort({ createdAt: -1 }).lean()
    return Establishment.find({ owner: user._id }).sort({ createdAt: -1 }).lean()
  },

  async create(input, user) {
    const baseSlug = slugify(input.name, { lower: true, strict: true, locale: 'es' })
    const collision = await Establishment.exists({ slug: baseSlug })
    const slug = collision ? `${baseSlug}-${Date.now().toString().slice(-5)}` : baseSlug
    return Establishment.create({
      owner: user._id,
      name: input.name,
      slug,
      category: input.category,
      description: input.description,
      address: {
        street: input.street,
        city: input.city,
        postalCode: input.postalCode,
        location: { type: 'Point', coordinates: [input.longitude, input.latitude] },
      },
      phone: input.phone,
      openingTime: input.openingTime,
      closingTime: input.closingTime,
      tags: [...new Set(input.tags)],
      isVerified: user.role === 'admin',
    })
  },

  async update(id, input, user) {
    const establishment = await Establishment.findById(id)
    if (!establishment) throw new ApiError(404, 'El comercio no existe', 'ESTABLISHMENT_NOT_FOUND')
    ensureOwner(establishment, user)

    const fields = ['name', 'category', 'description', 'phone', 'openingTime', 'closingTime']
    fields.forEach((field) => {
      if (input[field] !== undefined) establishment[field] = input[field]
    })
    if (input.tags) establishment.tags = [...new Set(input.tags)]
    if (input.street || input.city || input.postalCode || input.latitude || input.longitude) {
      establishment.address.street = input.street ?? establishment.address.street
      establishment.address.city = input.city ?? establishment.address.city
      establishment.address.postalCode = input.postalCode ?? establishment.address.postalCode
      const [longitude, latitude] = establishment.address.location.coordinates
      establishment.address.location.coordinates = [input.longitude ?? longitude, input.latitude ?? latitude]
    }
    await establishment.save()
    return establishment
  },

  async remove(id, user) {
    const establishment = await Establishment.findById(id)
    if (!establishment) throw new ApiError(404, 'El comercio no existe', 'ESTABLISHMENT_NOT_FOUND')
    ensureOwner(establishment, user)
    establishment.isActive = false
    await establishment.save()
    return establishment
  },
}

