import request from 'supertest'
import { describe, expect, it } from 'vitest'
import { createApp } from '../app.js'

describe('RePlato API', () => {
  const app = createApp()

  it('expone un endpoint de salud', async () => {
    const response = await request(app).get('/api/health')
    expect(response.status).toBe(200)
    expect(response.body.status).toBe('ok')
  })

  it('valida el formulario de registro antes de acceder a la base de datos', async () => {
    const response = await request(app).post('/api/auth/register').send({ email: 'incorrecto' })
    expect(response.status).toBe(400)
    expect(response.body.error.code).toBe('VALIDATION_ERROR')
  })

  it('devuelve una respuesta estructurada para rutas inexistentes', async () => {
    const response = await request(app).get('/api/no-existe')
    expect(response.status).toBe(404)
    expect(response.body.error).toMatchObject({ code: 'ROUTE_NOT_FOUND' })
  })
})

