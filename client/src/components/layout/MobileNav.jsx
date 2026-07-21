import { Compass, LayoutDashboard, LogIn, ShoppingBag, UserRound } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth.js'

export function MobileNav() {
  const { user } = useAuth()
  const dashboardPath = user?.role === 'admin' ? '/admin' : user?.role === 'partner' ? '/partner' : '/mis-reservas'
  return (
    <nav className="mobile-nav" aria-label="Navegación móvil">
      <NavLink to="/"><Compass size={20} /><span>Inicio</span></NavLink>
      <NavLink to="/ofertas"><ShoppingBag size={20} /><span>Ofertas</span></NavLink>
      {user ? (
        <NavLink to={dashboardPath}>
          {user.role === 'user' ? <UserRound size={20} /> : <LayoutDashboard size={20} />}
          <span>{user.role === 'user' ? 'Reservas' : 'Panel'}</span>
        </NavLink>
      ) : (
        <NavLink to="/login"><LogIn size={20} /><span>Entrar</span></NavLink>
      )}
    </nav>
  )
}

