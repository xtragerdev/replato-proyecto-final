import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Link, MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, vi } from 'vitest'
import { AppLayout } from '../components/layout/AppLayout.jsx'

vi.mock('../components/layout/Header.jsx', () => ({ Header: () => null }))
vi.mock('../components/layout/Footer.jsx', () => ({ Footer: () => null }))
vi.mock('../components/layout/MobileNav.jsx', () => ({ MobileNav: () => null }))

afterEach(() => {
  vi.restoreAllMocks()
})

describe('AppLayout', () => {
  it('mantiene la aplicación montada al navegar y vuelve al inicio de la página', async () => {
    const user = userEvent.setup()
    const scrollTo = vi.spyOn(window, 'scrollTo').mockImplementation(() => null)

    render(
      <MemoryRouter initialEntries={['/primera']}>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="primera" element={<Link to="/segunda">Ir a la segunda página</Link>} />
            <Route path="segunda" element={<h1>Segunda página</h1>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    )

    await user.click(screen.getByRole('link', { name: 'Ir a la segunda página' }))

    expect(await screen.findByRole('heading', { name: 'Segunda página' })).toBeInTheDocument()
    expect(scrollTo).toHaveBeenLastCalledWith({ top: 0, behavior: 'auto' })
  })
})
