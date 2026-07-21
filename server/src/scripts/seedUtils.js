import fs from 'node:fs/promises'
import { parse } from 'csv-parse/sync'
import { ApiError } from '../utils/ApiError.js'

export async function readCsv(filePath) {
  const source = await fs.readFile(filePath, 'utf8')
  return parse(source, {
    columns: true,
    skip_empty_lines: true,
    bom: true,
    cast(value, context) {
      if (context.header) return value
      if (value === 'true') return true
      if (value === 'false') return false
      return value
    },
  })
}

function assertUnique(rows, field, label) {
  const seen = new Set()
  for (const row of rows) {
    if (!row[field] || seen.has(row[field])) {
      throw new ApiError(400, `${label}: valor duplicado o vacío en ${field}: ${row[field] || '(vacío)'}`, 'INVALID_SEED')
    }
    seen.add(row[field])
  }
}

export function validateSeedData({ users, establishments, foodPacks, reservations }) {
  if (foodPacks.length < 100) {
    throw new ApiError(400, 'La colección food_packs debe contener al menos 100 filas', 'INVALID_SEED')
  }
  assertUnique(users, 'external_id', 'users')
  assertUnique(users, 'email', 'users')
  assertUnique(establishments, 'external_id', 'establishments')
  assertUnique(establishments, 'slug', 'establishments')
  assertUnique(foodPacks, 'external_id', 'food_packs')
  assertUnique(reservations, 'external_id', 'reservations')

  const userById = new Map(users.map((row) => [row.external_id, row]))
  const establishmentIds = new Set(establishments.map((row) => row.external_id))
  const packById = new Map(foodPacks.map((row) => [row.external_id, row]))
  const reservationPairs = new Set()

  for (const establishment of establishments) {
    const owner = userById.get(establishment.owner_external_id)
    if (!owner || owner.role !== 'partner') {
      throw new ApiError(400, `Propietario no válido en ${establishment.external_id}`, 'INVALID_SEED')
    }
  }

  for (const pack of foodPacks) {
    if (!establishmentIds.has(pack.establishment_external_id)) {
      throw new ApiError(400, `Comercio inexistente en ${pack.external_id}`, 'INVALID_SEED')
    }
    if (Number(pack.sale_price_cents) >= Number(pack.original_price_cents)) {
      throw new ApiError(400, `Precio incorrecto en ${pack.external_id}`, 'INVALID_SEED')
    }
  }

  for (const reservation of reservations) {
    const user = userById.get(reservation.user_external_id)
    if (!user || user.role !== 'user') {
      throw new ApiError(400, `Usuario no válido en ${reservation.external_id}`, 'INVALID_SEED')
    }
    if (!packById.has(reservation.pack_external_id)) {
      throw new ApiError(400, `Pack inexistente en ${reservation.external_id}`, 'INVALID_SEED')
    }
    const pair = `${reservation.user_external_id}:${reservation.pack_external_id}`
    if (reservationPairs.has(pair)) {
      throw new ApiError(400, `Reserva duplicada para ${pair}`, 'INVALID_SEED')
    }
    reservationPairs.add(pair)
  }

  return {
    users: users.length,
    establishments: establishments.length,
    foodPacks: foodPacks.length,
    reservations: reservations.length,
    total: users.length + establishments.length + foodPacks.length + reservations.length,
  }
}

export function splitList(value) {
  return value ? String(value).split('|').map((item) => item.trim()).filter(Boolean) : []
}

export function relativeDate(dayOffset, time = '00:00') {
  const date = new Date()
  date.setHours(0, 0, 0, 0)
  date.setDate(date.getDate() + Number(dayOffset))
  const [hours, minutes] = time.split(':').map(Number)
  date.setHours(hours, minutes, 0, 0)
  return date
}

