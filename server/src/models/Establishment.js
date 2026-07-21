import mongoose from 'mongoose'

const establishmentSchema = new mongoose.Schema(
  {
    externalId: { type: String, unique: true, sparse: true, index: true },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 100 },
    slug: { type: String, required: true, unique: true, trim: true, lowercase: true },
    category: {
      type: String,
      enum: ['bakery', 'greengrocer', 'restaurant', 'cafe', 'supermarket', 'prepared_food'],
      required: true,
    },
    description: { type: String, required: true, trim: true, maxlength: 400 },
    address: {
      street: { type: String, required: true },
      city: { type: String, required: true, index: true },
      postalCode: { type: String, required: true },
      location: {
        type: { type: String, enum: ['Point'], default: 'Point' },
        coordinates: { type: [Number], required: true },
      },
    },
    phone: { type: String, default: '' },
    image: {
      url: { type: String, default: '' },
      publicId: { type: String, default: '' },
    },
    openingTime: { type: String, default: '09:00' },
    closingTime: { type: String, default: '20:00' },
    tags: [{ type: String, trim: true }],
    isVerified: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true, versionKey: false },
)

establishmentSchema.index({ 'address.location': '2dsphere' })

export const Establishment = mongoose.model('Establishment', establishmentSchema)

