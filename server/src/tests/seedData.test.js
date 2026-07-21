import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { readCsv, validateSeedData } from '../scripts/seedUtils.js'

const currentDir = path.dirname(fileURLToPath(import.meta.url))
const csvDir = path.resolve(currentDir, '../../data/csv')

async function loadData() {
  const [users, establishments, foodPacks, reservations] = await Promise.all([
    readCsv(path.join(csvDir, 'users.csv')),
    readCsv(path.join(csvDir, 'establishments.csv')),
    readCsv(path.join(csvDir, 'food_packs.csv')),
    readCsv(path.join(csvDir, 'reservations.csv')),
  ])
  return { users, establishments, foodPacks, reservations }
}

describe('dataset inicial', () => {
  it('contiene 364 registros y 120 ofertas', async () => {
    const result = validateSeedData(await loadData())
    expect(result).toEqual({ users: 40, establishments: 24, foodPacks: 120, reservations: 180, total: 364 })
  })

  it('detecta relaciones inexistentes antes de escribir en MongoDB', async () => {
    const data = await loadData()
    data.foodPacks[0].establishment_external_id = 'EST-INEXISTENTE'
    expect(() => validateSeedData(data)).toThrow('Comercio inexistente')
  })
})
