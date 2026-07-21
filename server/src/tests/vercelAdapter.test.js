import { describe, expect, it } from 'vitest'
import { restoreApiRequestPath } from '../../../api/index.js'

describe('adaptador de rutas de Vercel', () => {
  it('restaura la ruta que recibe Express y conserva el resto de la query', () => {
    const request = { url: '/api?path=auth%2Flogin&next=reservas' }

    restoreApiRequestPath(request)

    expect(request.url).toBe('/api/auth/login?next=reservas')
  })

  it('no modifica peticiones directas a la API', () => {
    const request = { url: '/api/health' }

    restoreApiRequestPath(request)

    expect(request.url).toBe('/api/health')
  })
})
