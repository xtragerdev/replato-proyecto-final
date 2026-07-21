import mongoose from 'mongoose'

const userSchema = new mongoose.Schema(
  {
    externalId: { type: String, unique: true, sparse: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 80 },
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ['user', 'partner', 'admin'], default: 'user' },
    phone: { type: String, trim: true, default: '' },
    city: { type: String, trim: true, default: '' },
    postalCode: { type: String, trim: true, default: '' },
    avatarUrl: { type: String, default: '' },
    dietaryPreferences: [{ type: String, trim: true }],
    newsletterOptIn: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true, versionKey: false },
)

export const User = mongoose.model('User', userSchema)

