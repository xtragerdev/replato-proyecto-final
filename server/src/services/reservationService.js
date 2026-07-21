import { randomInt } from 'node:crypto'
import { Establishment } from '../models/Establishment.js'
import { FoodPack } from '../models/FoodPack.js'
import { Reservation } from '../models/Reservation.js'
import { ApiError } from '../utils/ApiError.js'

function pickupCode() {
  return `RP-${randomInt(1000, 9999)}`
}

export const reservationService = {
  async create(input, user) {
    const existing = await Reservation.exists({ pack: input.packId, user: user._id })
    if (existing) throw new ApiError(409, 'Ya tienes una reserva para esta oferta', 'DUPLICATE_RESERVATION')

    const pack = await FoodPack.findOneAndUpdate(
      {
        _id: input.packId,
        createdBy: { $ne: user._id },
        status: 'available',
        pickupEnd: { $gt: new Date() },
        stockRemaining: { $gte: input.quantity },
      },
      { $inc: { stockRemaining: -input.quantity } },
      { new: true },
    )

    if (!pack) throw new ApiError(409, 'La oferta no tiene suficiente disponibilidad', 'INSUFFICIENT_STOCK')

    try {
      const reservation = await Reservation.create({
        pack: pack._id,
        user: user._id,
        quantity: input.quantity,
        pickupCode: pickupCode(),
      })
      if (pack.stockRemaining === 0) {
        await FoodPack.updateOne({ _id: pack._id }, { status: 'sold_out' })
      }
      return reservation
    } catch (error) {
      await FoodPack.updateOne({ _id: pack._id }, { $inc: { stockRemaining: input.quantity }, status: 'available' })
      throw error
    }
  },

  async listMine(user) {
    return Reservation.find({ user: user._id })
      .populate({ path: 'pack', populate: { path: 'establishment', select: 'name slug address image' } })
      .sort({ createdAt: -1 })
      .lean()
  },

  async listReceived(user) {
    const establishmentIds = user.role === 'admin'
      ? await Establishment.find({}).distinct('_id')
      : await Establishment.find({ owner: user._id }).distinct('_id')
    const packIds = await FoodPack.find({ establishment: { $in: establishmentIds } }).distinct('_id')
    return Reservation.find({ pack: { $in: packIds } })
      .populate('user', 'name email avatarUrl')
      .populate({ path: 'pack', select: 'title pickupStart pickupEnd', populate: { path: 'establishment', select: 'name' } })
      .sort({ createdAt: -1 })
      .lean()
  },

  async cancel(id, user, reason = '') {
    const filter = { _id: id, status: { $in: ['pending', 'confirmed'] } }
    if (user.role !== 'admin') filter.user = user._id
    const reservation = await Reservation.findOneAndUpdate(
      filter,
      { status: 'cancelled', cancelReason: reason, cancelledAt: new Date() },
      { new: true },
    )
    if (!reservation) throw new ApiError(404, 'La reserva no se puede cancelar', 'RESERVATION_NOT_CANCELLABLE')
    await FoodPack.updateOne(
      { _id: reservation.pack },
      { $inc: { stockRemaining: reservation.quantity }, status: 'available' },
    )
    return reservation
  },

  async updateStatus(id, status, user) {
    const reservation = await Reservation.findById(id).populate('pack')
    if (!reservation) throw new ApiError(404, 'La reserva no existe', 'RESERVATION_NOT_FOUND')
    const establishment = await Establishment.findById(reservation.pack.establishment)
    if (user.role !== 'admin' && establishment.owner.toString() !== user._id.toString()) {
      throw new ApiError(403, 'No puedes gestionar esta reserva', 'FORBIDDEN')
    }
    const allowedOrigins = { confirmed: ['pending'], collected: ['confirmed'], cancelled: ['pending', 'confirmed'] }
    if (!allowedOrigins[status]?.includes(reservation.status)) {
      throw new ApiError(400, 'El cambio de estado no está permitido', 'INVALID_STATUS_TRANSITION')
    }

    const changes = { status }
    if (status === 'cancelled') {
      changes.cancelledAt = new Date()
    }
    const updated = await Reservation.findOneAndUpdate(
      { _id: reservation._id, status: { $in: allowedOrigins[status] } },
      { $set: changes },
      { new: true },
    )
    if (!updated) throw new ApiError(409, 'La reserva ya ha cambiado de estado', 'STATUS_ALREADY_CHANGED')
    if (status === 'cancelled') {
      await FoodPack.updateOne(
        { _id: reservation.pack._id },
        { $inc: { stockRemaining: reservation.quantity }, status: 'available' },
      )
    }
    return updated
  },
}
