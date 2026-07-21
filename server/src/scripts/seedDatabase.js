import bcrypt from 'bcryptjs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { connectDatabase, disconnectDatabase } from '../config/database.js'
import { env } from '../config/env.js'
import { Establishment } from '../models/Establishment.js'
import { FoodPack } from '../models/FoodPack.js'
import { Reservation } from '../models/Reservation.js'
import { User } from '../models/User.js'
import { readCsv, relativeDate, splitList, validateSeedData } from './seedUtils.js'

const currentDir = path.dirname(fileURLToPath(import.meta.url))
const csvDir = path.resolve(currentDir, '../../data/csv')

async function loadSourceData() {
  const [users, establishments, foodPacks, reservations] = await Promise.all([
    readCsv(path.join(csvDir, 'users.csv')),
    readCsv(path.join(csvDir, 'establishments.csv')),
    readCsv(path.join(csvDir, 'food_packs.csv')),
    readCsv(path.join(csvDir, 'reservations.csv')),
  ])
  return { users, establishments, foodPacks, reservations }
}

async function seed() {
  if (env.nodeEnv === 'production' && process.env.ALLOW_SEED !== 'true') {
    throw new Error('La semilla en producción requiere ALLOW_SEED=true')
  }

  const source = await loadSourceData()
  const counts = validateSeedData(source)
  await connectDatabase(env.mongoUri)

  const passwordHash = await bcrypt.hash(env.seedPassword, 12)
  await User.bulkWrite(
    source.users.map((row) => ({
      updateOne: {
        filter: { externalId: row.external_id },
        update: {
          $set: {
            name: row.full_name,
            email: row.email,
            role: row.role,
            phone: row.phone,
            city: row.city,
            postalCode: row.postal_code,
            avatarUrl: row.avatar_url,
            dietaryPreferences: splitList(row.dietary_preferences),
            newsletterOptIn: row.newsletter_opt_in,
            isActive: row.is_active,
          },
          $setOnInsert: { passwordHash },
        },
        upsert: true,
      },
    })),
  )

  const userMap = new Map(
    (await User.find({ externalId: { $in: source.users.map((row) => row.external_id) } }).select('_id externalId').lean())
      .map((item) => [item.externalId, item._id]),
  )

  await Establishment.bulkWrite(
    source.establishments.map((row) => ({
      updateOne: {
        filter: { externalId: row.external_id },
        update: {
          $set: {
            owner: userMap.get(row.owner_external_id),
            name: row.name,
            slug: row.slug,
            category: row.category,
            description: row.description,
            address: {
              street: row.street,
              city: row.city,
              postalCode: row.postal_code,
              location: { type: 'Point', coordinates: [Number(row.longitude), Number(row.latitude)] },
            },
            phone: row.phone,
            image: { url: row.image_url, publicId: '' },
            openingTime: row.opening_time,
            closingTime: row.closing_time,
            tags: splitList(row.tags),
            isVerified: row.is_verified,
            isActive: row.is_active,
          },
        },
        upsert: true,
      },
    })),
  )

  const establishmentRecords = await Establishment.find({
    externalId: { $in: source.establishments.map((row) => row.external_id) },
  }).select('_id externalId owner').lean()
  const establishmentMap = new Map(establishmentRecords.map((item) => [item.externalId, item]))

  await FoodPack.bulkWrite(
    source.foodPacks.map((row) => {
      const establishment = establishmentMap.get(row.establishment_external_id)
      return {
        updateOne: {
          filter: { externalId: row.external_id },
          update: {
            $set: {
              establishment: establishment._id,
              createdBy: establishment.owner,
              title: row.title,
              description: row.description,
              category: row.category,
              originalPriceCents: Number(row.original_price_cents),
              salePriceCents: Number(row.sale_price_cents),
              stockTotal: Number(row.stock_total),
              stockRemaining: Number(row.stock_remaining),
              pickupStart: relativeDate(row.pickup_day_offset, row.pickup_start_time),
              pickupEnd: relativeDate(row.pickup_day_offset, row.pickup_end_time),
              dietaryTags: splitList(row.dietary_tags),
              allergens: splitList(row.allergens),
              image: { url: row.image_url, publicId: '' },
              status: row.status,
              isFeatured: row.is_featured,
              estimatedWeightGrams: Number(row.estimated_weight_grams),
              impactCo2Grams: Number(row.impact_co2_grams),
            },
          },
          upsert: true,
        },
      }
    }),
  )

  const packMap = new Map(
    (await FoodPack.find({ externalId: { $in: source.foodPacks.map((row) => row.external_id) } }).select('_id externalId').lean())
      .map((item) => [item.externalId, item._id]),
  )

  await Reservation.bulkWrite(
    source.reservations.map((row) => ({
      updateOne: {
        filter: { externalId: row.external_id },
        update: {
          $set: {
            pack: packMap.get(row.pack_external_id),
            user: userMap.get(row.user_external_id),
            quantity: Number(row.quantity),
            status: row.status,
            pickupCode: row.pickup_code || undefined,
            rating: row.rating ? Number(row.rating) : undefined,
            review: row.review || '',
            cancelReason: row.cancel_reason || '',
            cancelledAt: row.status === 'cancelled' ? relativeDate(row.created_day_offset, row.created_time) : null,
          },
        },
        upsert: true,
      },
    })),
  )

  console.log('Semilla completada:', counts)
  console.log('Usuarios demo: admin@replato.test, partner@replato.test y user@replato.test')
  await disconnectDatabase()
}

seed().catch(async (error) => {
  console.error('Error en la semilla:', error.message)
  await disconnectDatabase().catch(() => {})
  process.exit(1)
})
