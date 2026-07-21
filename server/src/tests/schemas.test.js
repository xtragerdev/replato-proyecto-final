import { describe, expect, it } from 'vitest'
import { foodPackCreateSchema, registerSchema } from '../validators/schemas.js'

describe('esquemas de validación', () => {
  it('ignora el rol enviado durante el registro', () => {
    const result = registerSchema.parse({
      name: 'Usuario Demo',
      email: 'demo@replato.test',
      password: 'Segura123!',
      role: 'admin',
    })
    expect(result.role).toBeUndefined()
  })

  it('convierte correctamente los datos recibidos mediante FormData', () => {
    const result = foodPackCreateSchema.parse({
      establishmentId: '507f1f77bcf86cd799439011',
      title: 'Pack de prueba',
      description: 'Descripción suficientemente larga para una oferta de prueba.',
      category: 'mixed',
      originalPriceCents: '1200',
      salePriceCents: '450',
      stockTotal: '6',
      pickupStart: '2026-07-25T18:00:00.000Z',
      pickupEnd: '2026-07-25T20:00:00.000Z',
      allergens: 'gluten,milk',
      dietaryTags: '',
    })
    expect(result.stockTotal).toBe(6)
    expect(result.allergens).toEqual(['gluten', 'milk'])
  })
})

