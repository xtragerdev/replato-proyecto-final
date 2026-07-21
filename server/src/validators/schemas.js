import { z } from 'zod'

const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Identificador no válido')
const role = z.enum(['user', 'partner', 'admin'])
const packCategory = z.enum(['bakery', 'prepared_food', 'produce', 'breakfast', 'vegan', 'mixed'])
const establishmentCategory = z.enum(['bakery', 'greengrocer', 'restaurant', 'cafe', 'supermarket', 'prepared_food'])

const listFromForm = z.preprocess((value) => {
  if (Array.isArray(value)) return value
  if (typeof value === 'string') return value.split(',').map((item) => item.trim()).filter(Boolean)
  return []
}, z.array(z.string().max(40)).max(12))

export const registerSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8).max(72),
  city: z.string().trim().max(80).optional().default(''),
  newsletterOptIn: z.boolean().optional().default(false),
})

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1).max(72),
})

export const roleSchema = z.object({ role })

export const establishmentCreateSchema = z.object({
  name: z.string().trim().min(2).max(100),
  category: establishmentCategory,
  description: z.string().trim().min(20).max(400),
  street: z.string().trim().min(3).max(120),
  city: z.string().trim().min(2).max(80),
  postalCode: z.string().trim().regex(/^\d{5}$/),
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
  phone: z.string().trim().max(24).optional().default(''),
  openingTime: z.string().regex(/^\d{2}:\d{2}$/).optional().default('09:00'),
  closingTime: z.string().regex(/^\d{2}:\d{2}$/).optional().default('20:00'),
  tags: listFromForm,
})

export const establishmentUpdateSchema = establishmentCreateSchema.partial()

export const foodPackCreateSchema = z.object({
  establishmentId: objectId,
  title: z.string().trim().min(3).max(120),
  description: z.string().trim().min(20).max(600),
  category: packCategory,
  originalPriceCents: z.coerce.number().int().positive(),
  salePriceCents: z.coerce.number().int().positive(),
  stockTotal: z.coerce.number().int().min(1).max(100),
  pickupStart: z.coerce.date(),
  pickupEnd: z.coerce.date(),
  dietaryTags: listFromForm,
  allergens: listFromForm,
  isFeatured: z.preprocess((value) => value === true || value === 'true', z.boolean()).optional().default(false),
  estimatedWeightGrams: z.coerce.number().int().min(0).optional().default(0),
  impactCo2Grams: z.coerce.number().int().min(0).optional().default(0),
})

export const foodPackUpdateSchema = foodPackCreateSchema.omit({ establishmentId: true }).partial()

export const packQuerySchema = z.object({
  search: z.string().trim().max(80).optional(),
  category: packCategory.optional(),
  city: z.string().trim().max(80).optional(),
  establishment: objectId.optional(),
  featured: z.enum(['true', 'false']).optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(50).optional().default(12),
  sort: z.enum(['pickup', 'price', 'newest']).optional().default('pickup'),
})

export const reservationCreateSchema = z.object({
  packId: objectId,
  quantity: z.coerce.number().int().min(1).max(10).optional().default(1),
})

export const reservationStatusSchema = z.object({
  status: z.enum(['confirmed', 'collected', 'cancelled']),
  cancelReason: z.string().trim().max(200).optional(),
})

export const reservationCancelSchema = z.object({
  cancelReason: z.string().trim().max(200).optional().default(''),
})
