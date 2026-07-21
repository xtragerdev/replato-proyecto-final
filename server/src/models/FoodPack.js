import mongoose from 'mongoose'

const foodPackSchema = new mongoose.Schema(
  {
    externalId: { type: String, unique: true, sparse: true, index: true },
    establishment: { type: mongoose.Schema.Types.ObjectId, ref: 'Establishment', required: true, index: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, required: true, trim: true, maxlength: 600 },
    category: {
      type: String,
      enum: ['bakery', 'prepared_food', 'produce', 'breakfast', 'vegan', 'mixed'],
      required: true,
    },
    originalPriceCents: { type: Number, required: true, min: 1 },
    salePriceCents: { type: Number, required: true, min: 1 },
    stockTotal: { type: Number, required: true, min: 1 },
    stockRemaining: { type: Number, required: true, min: 0 },
    pickupStart: { type: Date, required: true, index: true },
    pickupEnd: { type: Date, required: true },
    dietaryTags: [{ type: String, trim: true }],
    allergens: [{ type: String, trim: true }],
    image: {
      url: { type: String, default: '' },
      publicId: { type: String, default: '' },
    },
    status: {
      type: String,
      enum: ['available', 'sold_out', 'expired', 'cancelled'],
      default: 'available',
      index: true,
    },
    isFeatured: { type: Boolean, default: false },
    estimatedWeightGrams: { type: Number, min: 0, default: 0 },
    impactCo2Grams: { type: Number, min: 0, default: 0 },
  },
  { timestamps: true, versionKey: false },
)

foodPackSchema.index({ establishment: 1, status: 1, pickupStart: 1 })
foodPackSchema.index({ title: 'text', description: 'text' })

export const FoodPack = mongoose.model('FoodPack', foodPackSchema)

