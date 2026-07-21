import { HeartHandshake, LogOut, Menu, Search, UserRound, X } from 'lucide-react'
import { useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth.js'
import { Logo } from '../common/Logo.jsx'

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false)
  const { pathname } = useLocation()
  const { user, logout } = useAuth()

  const accountPath = user?.role === 'admin' ? '/admin' : user?.role === 'partner' ? '/partner' : '/mis-reservas'

  return (
    <header className="site-header">
      <div className="container header-inner">
        <Logo />
        <nav className={`main-nav ${menuOpen ? 'is-open' : ''}`} aria-label="Navegación principal">
          <NavLink to="/" end>Inicio</NavLink>
          <NavLink to="/ofertas">Explorar</NavLink>
          <NavLink to="/como-funciona">Cómo funciona</NavLink>
          {user && <NavLink to={accountPath}>{user.role === 'user' ? 'Mis reservas' : 'Panel'}</NavLink>}
        </nav>
        <div className="header-actions">
          <Link className="icon-button desktop-only" to="/ofertas" aria-label="Buscar ofertas"><Search size={19} /></Link>
          {user ? (
            <>
              <Link className="account-chip desktop-only" to={accountPath}><UserRound size={17} /> {user.name.split(' ')[0]}</Link>
              <button className="icon-button desktop-only" type="button" onClick={logout} aria-label="Cerrar sesión"><LogOut size={18} /></button>
            </>
          ) : (
            <Link className="button button-primary desktop-only" to="/login"><HeartHandshake size={17} /> Entrar</Link>
          )}
          <button
            className="icon-button menu-button"
            type="button"
            aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((value) => !value)}
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>
      {menuOpen && <button className="menu-backdrop" type="button" aria-label="Cerrar menú" onClick={() => setMenuOpen(false)} />}
      <span className="route-announcer sr-only" aria-live="polite">{pathname}</span>
    </header>
  )
}

