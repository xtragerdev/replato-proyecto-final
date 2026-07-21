import { deleteImage, uploadImage } from '../config/cloudinary.js'
import { Establishment } from '../models/Establishment.js'
import { FoodPack } from '../models/FoodPack.js'
import { Reservation } from '../models/Reservation.js'
import { ApiError } from '../utils/ApiError.js'

const sortMap = {
  pickup: { pickupStart: 1 },
  price: { salePriceCents: 1 },
  newest: { createdAt: -1 },
}

function ensureOwner(establishment, user) {
  if (user.role !== 'admin' && establishment.owner.toString() !== user._id.toString()) {
    throw new ApiError(403, 'Solo puedes gestionar ofertas de tus comercios', 'NOT_ESTABLISHMENT_OWNER')
  }
}

function validateBusinessRules(input) {
  if (input.salePriceCents >= input.originalPriceCents) {
    throw new ApiError(400, 'El precio reducido debe ser menor que el original', 'INVALID_PRICE')
  }
  if (new Date(input.pickupEnd) <= new Date(input.pickupStart)) {
    throw new ApiError(400, 'La franja de recogida no es válida', 'INVALID_PICKUP_WINDOW')
  }
}

function uniqueStrings(values = []) {
  const seen = new Set()
  return values.filter((value) => {
    const normalized = value.trim().toLocaleLowerCase('es')
    if (!normalized || seen.has(normalized)) return false
    seen.add(normalized)
    return true
  })
}

async function activeEstablishmentIds(query = {}) {
  const filter = { isActive: true }
  if (query.city) filter['address.city'] = query.city
  if (query.establishment) filter._id = query.establishment
  return Establishment.find(filter).distinct('_id')
}

export const foodPackService = {
  async list(query) {
    const filter = { status: 'available', stockRemaining: { $gt: 0 }, pickupEnd: { $gt: new Date() } }
    if (query.category) filter.category = query.category
    if (query.featured) filter.isFeatured = query.featured === 'true'
    if (query.search) filter.$text = { $search: query.search }
    filter.establishment = { $in: await activeEstablishmentIds(query) }

    const skip = (query.page - 1) * query.limit
    const [items, total] = await Promise.all([
      FoodPack.find(filter)
        .populate('establishment', 'name slug category address image isVerified')
        .sort(sortMap[query.sort])
        .skip(skip)
        .limit(query.limit)
        .lean(),
      FoodPack.countDocuments(filter),
    ])

    return { items, page: query.page, limit: query.limit, total, pages: Math.ceil(total / query.limit) }
  },

  async featured(limit = 6) {
    const establishments = await activeEstablishmentIds()
    return FoodPack.find({
      establishment: { $in: establishments },
      status: 'available',
      stockRemaining: { $gt: 0 },
      pickupEnd: { $gt: new Date() },
    })
      .populate('establishment', 'name slug address image isVerified')
      .sort({ isFeatured: -1, pickupStart: 1 })
      .limit(limit)
      .lean()
  },

  async getById(id) {
    const pack = await FoodPack.findById(id)
      .populate('establishment', 'name slug category description address phone image openingTime closingTime isVerified isActive owner')
      .lean()
    if (!pack || !pack.establishment?.isActive) throw new ApiError(404, 'La oferta no existe', 'PACK_NOT_FOUND')
    return pack
  },

  async listMine(user) {
    const establishments = user.role === 'admin'
      ? await Establishment.find({}).distinct('_id')
      : await Establishment.find({ owner: user._id }).distinct('_id')
    return FoodPack.find({ establishment: { $in: establishments } })
      .populate('establishment', 'name slug')
      .sort({ createdAt: -1 })
      .lean()
  },

  async create(input, user, file) {
    validateBusinessRules(input)
    const establishment = await Establishment.findById(input.establishmentId)
    if (!establishment || !establishment.isActive) {
      throw new ApiError(404, 'El comercio no está disponible', 'ESTABLISHMENT_NOT_FOUND')
    }
    ensureOwner(establishment, user)
    if (!establishment.isVerified && user.role !== 'admin') {
      throw new ApiError(403, 'El comercio debe estar verificado para publicar', 'ESTABLISHMENT_NOT_VERIFIED')
    }

    const { establishmentId: _establishmentId, ...packInput } = input
    const image = file ? await uploadImage(file.buffer) : { url: establishment.image.url, publicId: '' }
    try {
      return await FoodPack.create({
        establishment: establishment._id,
        createdBy: user._id,
        ...packInput,
        stockRemaining: input.stockTotal,
        dietaryTags: uniqueStrings(input.dietaryTags),
        allergens: uniqueStrings(input.allergens),
        image,
        status: 'available',
      })
    } catch (error) {
      if (file) await deleteImage(image.publicId).catch(() => {})
      throw error
    }
  },

  async update(id, input, user, file) {
    const pack = await FoodPack.findById(id)
    if (!pack) throw new ApiError(404, 'La oferta no existe', 'PACK_NOT_FOUND')
    const establishment = await Establishment.findById(pack.establishment)
    ensureOwner(establishment, user)

    const merged = {
      originalPriceCents: input.originalPriceCents ?? pack.originalPriceCents,
      salePriceCents: input.salePriceCents ?? pack.salePriceCents,
      pickupStart: input.pickupStart ?? pack.pickupStart,
      pickupEnd: input.pickupEnd ?? pack.pickupEnd,
    }
    validateBusinessRules(merged)

    if (input.stockTotal !== undefined) {
      const reserved = pack.stockTotal - pack.stockRemaining
      if (input.stockTotal < reserved) {
        throw new ApiError(400, 'El stock no puede ser menor que las unidades ya reservadas', 'INVALID_STOCK')
      }
      pack.stockRemaining = input.stockTotal - reserved
    }

    const normalizedInput = {
      ...input,
      ...(input.dietaryTags ? { dietaryTags: uniqueStrings(input.dietaryTags) } : {}),
      ...(input.allergens ? { allergens: uniqueStrings(input.allergens) } : {}),
    }
    Object.entries(normalizedInput).forEach(([key, value]) => {
      if (key !== 'stockTotal' && value !== undefined) pack[key] = value
    })
    if (input.stockTotal !== undefined) pack.stockTotal = input.stockTotal
    if (file) {
      const previousPublicId = pack.image.publicId
      const nextImage = await uploadImage(file.buffer)
      pack.image = nextImage
      try {
        await pack.save()
      } catch (error) {
        await deleteImage(nextImage.publicId).catch(() => {})
        throw error
      }
      await deleteImage(previousPublicId).catch(() => {})
      return pack
    }
    await pack.save()
    return pack
  },

  async remove(id, user) {
    const pack = await FoodPack.findById(id)
    if (!pack) throw new ApiError(404, 'La oferta no existe', 'PACK_NOT_FOUND')
    const establishment = await Establishment.findById(pack.establishment)
    ensureOwner(establishment, user)
    const activeReservations = await Reservation.countDocuments({
      pack: pack._id,
      status: { $in: ['pending', 'confirmed'] },
    })
    if (activeReservations) {
      throw new ApiError(409, 'No se puede eliminar una oferta con reservas activas', 'ACTIVE_RESERVATIONS')
    }
    await FoodPack.deleteOne({ _id: pack._id })
    await deleteImage(pack.image.publicId)
    return pack
  },

  async impact() {
    const [packs, reservations] = await Promise.all([
      FoodPack.aggregate([
        { $match: { status: { $ne: 'cancelled' } } },
        { $group: { _id: null, availablePacks: { $sum: 1 }, co2Grams: { $sum: '$impactCo2Grams' }, foodGrams: { $sum: '$estimatedWeightGrams' } } },
      ]),
      Reservation.countDocuments({ status: 'collected' }),
    ])
    const totals = packs[0] || { availablePacks: 0, co2Grams: 0, foodGrams: 0 }
    return { ...totals, collectedReservations: reservations }
  },
}
