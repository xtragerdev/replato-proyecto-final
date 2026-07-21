import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useAuth } from '../hooks/useAuth.js'
import { ProtectedRoute, RoleRoute } from '../routes/RouteGuards.jsx'

vi.mock('../hooks/useAuth.js', () => ({ useAuth: vi.fn() }))

function LoginDestination() {
  const location = useLocation()
  return <p>Login desde {location.state?.from?.pathname || 'ninguna ruta'}</p>
}

describe('guardas de rutas', () => {
  beforeEach(() => {
    useAuth.mockReset()
  })

  it('conserva la ruta solicitada al enviar una sesión anónima al login', async () => {
    useAuth.mockReturnValue({ isAuthenticated: false, isCheckingSession: false, user: null })
    render(
      <MemoryRouter initialEntries={['/mis-reservas']}>
        <Routes>
          <Route element={<ProtectedRoute />}>
            <Route path="/mis-reservas" element={<p>Zona privada</p>} />
          </Route>
          <Route path="/login" element={<LoginDestination />} />
        </Routes>
      </MemoryRouter>,
    )

    expect(await screen.findByText('Login desde /mis-reservas')).toBeInTheDocument()
    expect(screen.queryByText('Zona privada')).not.toBeInTheDocument()
  })

  it('renderiza la ruta privada cuando hay una sesión válida', () => {
    useAuth.mockReturnValue({ isAuthenticated: true, isCheckingSession: false, user: { role: 'user' } })
    render(
      <MemoryRouter initialEntries={['/mis-reservas']}>
        <Routes>
          <Route element={<ProtectedRoute />}>
            <Route path="/mis-reservas" element={<p>Zona privada</p>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    )

    expect(screen.getByText('Zona privada')).toBeInTheDocument()
  })

  it('bloquea un panel cuando el rol no está autorizado', async () => {
    useAuth.mockReturnValue({ isAuthenticated: true, isCheckingSession: false, user: { role: 'user' } })
    render(
      <MemoryRouter initialEntries={['/admin']}>
        <Routes>
          <Route element={<RoleRoute roles={['admin']} />}>
            <Route path="/admin" element={<p>Panel de administración</p>} />
          </Route>
          <Route path="/sin-permiso" element={<p>Acceso restringido</p>} />
        </Routes>
      </MemoryRouter>,
    )

    expect(await screen.findByText('Acceso restringido')).toBeInTheDocument()
    expect(screen.queryByText('Panel de administración')).not.toBeInTheDocument()
  })
})

