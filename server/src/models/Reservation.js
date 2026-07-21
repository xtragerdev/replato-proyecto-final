import mongoose from 'mongoose'

const reservationSchema = new mongoose.Schema(
  {
    externalId: { type: String, unique: true, sparse: true, index: true },
    pack: { type: mongoose.Schema.Types.ObjectId, ref: 'FoodPack', required: true, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    quantity: { type: Number, required: true, min: 1, max: 10 },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'collected', 'cancelled'],
      default: 'pending',
      index: true,
    },
    pickupCode: { type: String, unique: true, sparse: true, index: true },
    rating: { type: Number, min: 1, max: 5 },
    review: { type: String, trim: true, maxlength: 300, default: '' },
    cancelReason: { type: String, trim: true, maxlength: 200, default: '' },
    cancelledAt: { type: Date, default: null },
  },
  { timestamps: true, versionKey: false },
)

reservationSchema.index({ user: 1, pack: 1 }, { unique: true })

export const Reservation = mongoose.model('Reservation', reservationSchema)
