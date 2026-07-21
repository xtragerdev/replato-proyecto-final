import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useAuth } from '../hooks/useAuth.js'
import LoginPage from '../pages/LoginPage.jsx'
import RegisterPage from '../pages/RegisterPage.jsx'

vi.mock('../hooks/useAuth.js', () => ({ useAuth: vi.fn() }))

describe('formularios de acceso', () => {
  beforeEach(() => {
    useAuth.mockReset()
  })

  it('no envía el login y anuncia los errores cuando faltan credenciales', async () => {
    const login = vi.fn()
    useAuth.mockReturnValue({ isAuthenticated: false, user: null, login })
    const user = userEvent.setup()
    render(<MemoryRouter><LoginPage /></MemoryRouter>)

    await user.click(screen.getByRole('button', { name: /^Entrar/ }))

    expect(await screen.findByText('Escribe tu correo')).toBeInTheDocument()
    expect(screen.getByText('Escribe tu contraseña')).toBeInTheDocument()
    expect(login).not.toHaveBeenCalled()
  })

  it('rellena una cuenta demo y entra en el panel adecuado a su rol', async () => {
    const login = vi.fn().mockResolvedValue({ role: 'partner' })
    useAuth.mockReturnValue({ isAuthenticated: false, user: null, login })
    const user = userEvent.setup()
    render(
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/partner" element={<p>Panel del comercio</p>} />
        </Routes>
      </MemoryRouter>,
    )

    await user.click(screen.getByRole('button', { name: 'Comercio' }))
    expect(screen.getByLabelText('Correo electrónico')).toHaveValue('partner@replato.test')
    expect(screen.getByLabelText('Contraseña')).toHaveValue('RePlato2026!')
    await user.click(screen.getByRole('button', { name: /^Entrar/ }))

    expect(await screen.findByText('Panel del comercio')).toBeInTheDocument()
    expect(login).toHaveBeenCalledWith({ email: 'partner@replato.test', password: 'RePlato2026!' })
  })

  it('impide crear una cuenta cuando las contraseñas no coinciden', async () => {
    const createAccount = vi.fn()
    useAuth.mockReturnValue({ isAuthenticated: false, user: null, register: createAccount })
    const user = userEvent.setup()
    render(<MemoryRouter><RegisterPage /></MemoryRouter>)

    await user.type(screen.getByLabelText('Nombre'), 'Lucía Pérez')
    await user.type(screen.getByLabelText('Correo electrónico'), 'lucia@example.com')
    await user.type(screen.getByLabelText('Contraseña'), 'segura123')
    await user.type(screen.getByLabelText('Repite la contraseña'), 'distinta123')
    await user.click(screen.getByRole('button', { name: /Crear cuenta/ }))

    expect(await screen.findByText('Las contraseñas no coinciden')).toBeInTheDocument()
    expect(createAccount).not.toHaveBeenCalled()
  })

  it('envía al backend únicamente los campos admitidos en el registro', async () => {
    const createAccount = vi.fn().mockResolvedValue({ role: 'user' })
    useAuth.mockReturnValue({ isAuthenticated: false, user: null, register: createAccount })
    const user = userEvent.setup()
    render(
      <MemoryRouter initialEntries={['/registro']}>
        <Routes>
          <Route path="/registro" element={<RegisterPage />} />
          <Route path="/ofertas" element={<p>Ofertas disponibles</p>} />
        </Routes>
      </MemoryRouter>,
    )

    await user.type(screen.getByLabelText('Nombre'), 'Lucía Pérez')
    await user.type(screen.getByLabelText('Correo electrónico'), 'lucia@example.com')
    await user.type(screen.getByLabelText('Ciudad (opcional)'), 'Madrid')
    await user.type(screen.getByLabelText('Contraseña'), 'segura123')
    await user.type(screen.getByLabelText('Repite la contraseña'), 'segura123')
    await user.click(screen.getByRole('checkbox'))
    await user.click(screen.getByRole('button', { name: /Crear cuenta/ }))

    expect(await screen.findByText('Ofertas disponibles')).toBeInTheDocument()
    expect(createAccount).toHaveBeenCalledWith({
      name: 'Lucía Pérez',
      email: 'lucia@example.com',
      city: 'Madrid',
      password: 'segura123',
      newsletterOptIn: true,
    })
  })
})

